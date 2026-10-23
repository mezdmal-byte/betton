import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { buildEventBody, validateEventStep, type CreateEventBody } from '../api/eventsV3';
import { ConnectedModerationScreen, ModerationFields } from './ConnectedModerationScreen';
import { moderationChanges, moderationDraft, publicReviewRows } from './moderationV3';
const terms: CreateEventBody = {
    event_type: 'public', question: 'BTC выше выбранного уровня?', outcomes: ['Выше', 'Не выше'], category: 'crypto', description: '', rules: 'Сравнить цену на дату завершения', criteria: ['Строго выше', 'Равна или ниже'], resolution_method: 'Основной источник в 23:59 UTC', unverifiable: 'Отмена и возврат ставок', primary_source: { name: 'Источник', url: 'https://example.com/price' }, backup_source: null,
    close_at: '2099-12-31T23:00:00Z', ends_at: '2099-12-31T23:59:00Z',
};
describe('public event moderation v3', () => {
    it('retains all structured fields through an untouched editor round trip', () => {
        const draft = moderationDraft(terms);
        const body = buildEventBody(draft);
        expect(moderationChanges(terms, body)).toEqual([]);
        expect(body.outcomes).toEqual(terms.outcomes);
        expect(body.primary_source).toEqual(terms.primary_source);
        expect(body.backup_source).toBeNull();
        expect(body.close_at).not.toBe(body.ends_at);
        expect(body).not.toHaveProperty('creator_id');
    });
    it('compares source links, criteria, cancellation rules and both dates independently', () => {
        const next: CreateEventBody = { ...terms, primary_source: { ...terms.primary_source!, url: 'https://example.com/new' }, criteria: ['Другой критерий', terms.criteria![1]], unverifiable: 'Другой порядок', close_at: '2099-12-31T22:00:00Z' };
        expect(moderationChanges(terms, next).map((row) => row.label)).toEqual(['Критерий первого исхода', 'Если результат нельзя определить', 'Ссылка на основной источник', 'Приём ставок до · UTC']);
        expect(moderationChanges(terms, next).some((row) => row.label === 'Завершение события · UTC')).toBe(false);
    });
    it('does not require a backup source and catches bad input before comparison', () => {
        const draft = moderationDraft(terms);
        expect(validateEventStep(draft, 'conditions')).toEqual({});
        const errors = { ...validateEventStep({ ...draft, outcomeB: draft.outcomeA }, 'question'), ...validateEventStep({ ...draft, sourceUrl: 'javascript:alert(1)', closeAt: '2000-01-01T00:00' }, 'conditions') };
        expect(errors.outcomeB).toBeTruthy();
        expect(errors.sourceUrl).toBeTruthy();
        expect(errors.closeAt).toBeTruthy();
    });
    it('renders every required edit control, separate deadlines and inline error', () => {
        const html = renderToStaticMarkup(createElement(ModerationFields, { draft: moderationDraft(terms), errors: { sourceUrl: 'Проверьте ссылку' }, onChange: () => undefined }));
        expect(html).toContain('Первый исход');
        expect(html).toContain('Второй исход');
        expect(html).toContain('Основной источник · обязательно');
        expect(html).toContain('Резервный источник · необязательно');
        expect(html).toContain('mod-closeAt');
        expect(html).toContain('mod-endsAt');
        expect(html).toContain('aria-invalid="true"');
        expect(html).toContain('Проверьте ссылку');
        expect(html).not.toContain('API');
    });
    it('shows an access boundary without a queue or publish control for non-admins', () => {
        const client = new QueryClient();
        const html = renderToStaticMarkup(createElement(QueryClientProvider, { client }, createElement(ConnectedModerationScreen, { enabled: false, onBack: () => undefined })));
        expect(html).toContain('Доступ запрещён');
        expect(html).not.toContain('Подтвердить публикацию');
        expect(html).not.toContain('Проверить заявку');
        client.clear();
    });
    it('review retains optional-source absence without inventing sources or fees', () => {
        const text = publicReviewRows(terms).map((row) => row.value).join('\n');
        expect(text).toContain('Резервный: не указан');
        expect(text).toContain('Отмена и возврат ставок');
        expect(text).not.toContain('75%');
        expect(text).not.toContain('0 TON');
    });
});
