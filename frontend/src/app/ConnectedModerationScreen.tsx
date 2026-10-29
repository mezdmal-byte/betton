import { useEffect, useState, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { errorDetail } from '../api/errors';
import { approveMarket, listModerationQueue, rejectMarket } from '../api/moderation';
import { eventV3Action, getEventRevisions, getEventTerms, type EventTermsV3 } from '../api/eventGovernanceV3';
import { type DraftErrors, type EventDraft } from '../api/eventsV3';
import type { MarketOut } from '../api/types';
import { queryKeys } from '../api/query';
import { Button } from '../components/Button/Button';
import { TextField } from '../components/TextField/TextField';
import { syncTelegramBackButton } from '../telegram/webapp';
import { moderationDraft, moderationChanges, publicReviewRows, buildModerationBody, validateModerationStep } from './moderationV3';
import styles from './ModerationWorkflow.module.css';
export type ConnectedModerationScreenProps = {
    enabled: boolean;
    onBack: () => void;
};
type View = 'review' | 'edit' | 'compare' | 'original' | 'reject' | 'approve';
export function ConnectedModerationScreen({ enabled, onBack }: ConnectedModerationScreenProps) {
    const queue = useQuery({ queryKey: queryKeys.moderation, queryFn: listModerationQueue, enabled });
    const [selected, setSelected] = useState<MarketOut | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    if (!enabled)
        return <Shell title="Доступ запрещён" onBack={onBack}><p>Для просмотра заявок нужна роль администратора.</p></Shell>;
    if (selected)
        return <ModerationReview market={selected} onBack={() => setSelected(null)} onDone={(message) => { setSuccess(message); setSelected(null); }}/>;
    return <Shell title="Модерация событий" onBack={onBack} context="Заявки до публикации">
    {success ? <p role="status" className={styles.notice}>{success}</p> : null}
    {queue.isPending ? <p role="status">Загружаем заявки…</p> : queue.isError ? <><p role="alert">{errorDetail(queue.error)}</p><Button fullWidth onClick={() => { void queue.refetch(); }}>Повторить</Button></> : queue.data?.length ? queue.data.map((market) => <button key={market.id} type="button" className={styles.queueRow} onClick={() => { setSuccess(null); setSelected(market); }}><small>Событие #{market.id}</small><strong>{market.question}</strong><span>Проверить заявку →</span></button>) : <p>Новых заявок на модерацию нет.</p>}
  </Shell>;
}
function ModerationReview({ market, onBack, onDone }: {
    market: MarketOut;
    onBack: () => void;
    onDone: (message: string) => void;
}) {
    const client = useQueryClient();
    const terms = useQuery({ queryKey: ['event-terms-v3', market.id], queryFn: () => getEventTerms(market.id) });
    const revisions = useQuery({ queryKey: ['event-revisions-v3', market.id], queryFn: () => getEventRevisions(market.id), enabled: Boolean(terms.data) });
    const [view, setView] = useState<View>('review');
    const [draft, setDraft] = useState<EventDraft | null>(null);
    const [editBase, setEditBase] = useState<EventTermsV3 | null>(null);
    const [errors, setErrors] = useState<DraftErrors>({});
    const [reason, setReason] = useState('');
    const [saved, setSaved] = useState<string | null>(null);
    const [publishRevision, setPublishRevision] = useState<number | null>(null);
    const refresh = async () => {
        await Promise.all([
            client.invalidateQueries({ queryKey: queryKeys.moderation }), client.invalidateQueries({ queryKey: ['markets'] }), client.invalidateQueries({ queryKey: queryKeys.market(market.id) }), client.invalidateQueries({ queryKey: ['event-terms-v3', market.id] }), client.invalidateQueries({ queryKey: ['event-revisions-v3', market.id] }), client.invalidateQueries({ queryKey: ['notifications'] }),
        ]);
    };
    const action = useMutation({
        mutationFn: async (kind: 'save' | 'approve' | 'reject') => {
            if (kind === 'save') {
                if (!editBase || !draft)
                    throw new Error('Обновите заявку перед сохранением');
                await eventV3Action(market.id, 'moderation', { expected_revision: editBase.revision, event: buildModerationBody(draft, editBase) }, 'PUT');
            }
            else if (kind === 'approve') {
                if (terms.data) {
                    if (publishRevision == null) throw new Error('Откройте подтверждение публикации заново');
                    await eventV3Action(market.id, 'moderation/publish', { expected_revision: publishRevision });
                } else await approveMarket(market.id);
            }
            else
                await rejectMarket(market.id, reason.trim());
            return kind;
        },
        onSuccess: async (kind) => {
            await refresh();
            if (kind === 'save') {
                setSaved('Правки сохранены. Первоначальная редакция доступна в истории.');
                setDraft(null);
                setView('review');
            }
            else
                onDone(kind === 'approve' ? 'Событие одобрено и опубликовано.' : 'Заявка отклонена; причина отправлена создателю.');
        },
    });
    const back = () => { if (action.isPending)
        return; action.reset(); setSaved(null); if (view === 'review')
        onBack();
    else
        setView(view === 'compare' && draft ? 'edit' : 'review'); };
    useEffect(() => syncTelegramBackButton(true, back), [view, draft, action.isPending]);
    const beginEdit = () => { if (terms.data) {
        setEditBase(terms.data);
        setDraft(moderationDraft(terms.data));
        setErrors({});
        action.reset();
        setView('edit');
    } };
    const compareDraft = () => {
        if (!draft)
            return;
        const nextErrors = { ...validateModerationStep(draft, 'question', editBase), ...validateModerationStep(draft, 'conditions', editBase) };
        setErrors(nextErrors);
        if (!Object.keys(nextErrors).length)
            setView('compare');
        else
            requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
    };
    const original = revisions.data?.find((row) => row.kind === 'created')?.snapshot;
    const current = terms.data;
    const creatorLabel = market.creator?.telegram_username ? '@' + market.creator.telegram_username.replace(/^@/, '') : market.creator?.display_name || '#' + (current?.creator_id ?? market.creator_id);
    const title = { review: 'Проверка заявки', edit: 'Редактирование', compare: 'Изменения заявки', original: 'Первоначальная версия', reject: 'Отклонить заявку', approve: 'Одобрение и публикация' }[view];
    const footer = !current && terms.isPending ? undefined : view === 'edit' ? <Button fullWidth onClick={compareDraft}>Сравнить изменения</Button> : view === 'compare' && draft && editBase ? <Button fullWidth loading={action.isPending} disabled={moderationChanges(editBase, buildModerationBody(draft, editBase)).length === 0} onClick={() => action.mutate('save')}>Зафиксировать правки</Button> : view === 'review' ? <Button fullWidth disabled={action.isPending} onClick={() => { setPublishRevision(current?.revision ?? null); setView('approve'); }}>{current?.moderator_edited ? 'Одобрить и опубликовать' : 'Одобрить без изменений'}</Button> : view === 'approve' ? <Button fullWidth loading={action.isPending} onClick={() => action.mutate('approve')}>Подтвердить публикацию</Button> : view === 'reject' ? <Button fullWidth disabled={!reason.trim()} loading={action.isPending} onClick={() => action.mutate('reject')}>Отклонить заявку</Button> : undefined;
    return <Shell title={title} context={`Модератор · #${market.id} · До публикации`} onBack={back} footer={!terms.isError ? footer : undefined}>
    {terms.isPending ? <p role="status">Загружаем условия…</p> : terms.isError ? <><p role="alert">{errorDetail(terms.error)}</p><Button fullWidth onClick={() => { void terms.refetch(); }}>Повторить</Button></> : <>
      {saved ? <p role="status" className={styles.notice}>{saved}</p> : null}
      {action.isError ? <p role="alert" className={styles.error}>{errorDetail(action.error)} <button type="button" className={styles.link} onClick={() => { void refresh(); action.reset(); }}>Обновить данные</button></p> : null}
      {view === 'review' ? <>
        <section className={styles.row}><span>Первоначальный создатель</span><p>{creatorLabel} · авторство и вознаграждение сохраняются.</p></section>
        {current ? <ReviewRows terms={current} onEdit={beginEdit}/> : <><section className={styles.row}><span>Название события</span><p>{market.question}</p></section><section className={styles.row}><span>Описание и исходы</span><p>{market.description}</p><p>{market.outcomes.join(' / ')}</p></section><p className={styles.notice}>Прежний формат заявки: структурированное редактирование недоступно. Можно одобрить исходную заявку или отклонить её.</p></>}
        {current ? <><Button variant="secondary" fullWidth onClick={beginEdit}>Редактировать заявку</Button><Button variant="secondary" fullWidth onClick={() => { setDraft(null); setView('compare'); }}>Сравнить редакции</Button></> : null}
        <Button variant="secondary" fullWidth onClick={() => setView('reject')}>Отклонить</Button>
      </> : view === 'edit' && draft ? <><p className={styles.secondary}>Создатель: {creatorLabel}</p><ModerationFields startOnly={editBase?.timing_version === 'start-v1'} draft={draft} errors={errors} onValidate={(key) => { const checked = { ...validateModerationStep(draft, 'question', editBase), ...validateModerationStep(draft, 'conditions', editBase) }; setErrors((previous) => ({ ...previous, [key]: checked[key] })); }} onChange={(key, value) => { setDraft((previous) => previous ? { ...previous, [key]: value } : null); setErrors((previous) => ({ ...previous, [key]: undefined })); }}/></> : view === 'compare' ? <>
        <p className={styles.secondary}>{draft ? `Редакция ${editBase?.revision} → ${Number(editBase?.revision) + 1} · До публикации` : `Первоначальная → редакция ${current?.revision}`}</p>
        {draft && editBase ? <ChangeRows before={editBase} after={buildModerationBody(draft, editBase)}/> : revisions.isPending ? <p role="status">Загружаем историю…</p> : revisions.isError ? <><p role="alert">{errorDetail(revisions.error)}</p><Button fullWidth onClick={() => { void revisions.refetch(); }}>Повторить</Button></> : original && current ? <ChangeRows before={original} after={current}/> : <p>Первоначальная версия не найдена.</p>}
        <section className={styles.row}><span>Запись изменений</span>{revisions.data?.map((row) => <p key={row.id}>Редакция {row.revision} · {row.kind === 'created' ? 'создатель' : row.kind === 'moderation_edit' ? 'модератор' : row.kind} · {new Date(row.created_at).toLocaleString('ru-RU', { timeZone: 'UTC' })} UTC</p>)}</section>
        <Button variant="secondary" fullWidth disabled={!original} onClick={() => setView('original')}>Посмотреть первоначальную версию</Button>
        <Button variant="secondary" fullWidth onClick={() => { if (!draft)
                beginEdit();
            else
                setView('edit'); }}>Продолжить редактирование</Button>
      </> : view === 'original' ? original ? <ReviewRows terms={original}/> : <p>Первоначальная версия недоступна.</p> : view === 'reject' ? <><p>Причина будет видна создателю события.</p><TextField label="Причина отклонения" value={reason} onChange={setReason} multiline maxLength={1000} disabled={action.isPending}/></> : view === 'approve' ? <ModerationPublishConfirmation marketId={market.id} question={current?.question ?? market.question} edited={Boolean(current?.moderator_edited)} /> : null}
    </>}
  </Shell>;
}
export function ModerationPublishConfirmation({ marketId, question, edited }: { marketId: number; question: string; edited: boolean }) {
    return <><p>{edited ? 'Будет опубликована текущая редакция с сохранёнными правками модератора. Создатель получит уведомление.' : 'Событие станет доступно всем после публикации.'}</p><section className={styles.row}><span>Событие #{marketId}</span><p>{question}</p></section><p>После начала приёма ставок изменить условия события нельзя.</p></>;
}
function ReviewRows({ terms, onEdit }: {
    terms: Parameters<typeof publicReviewRows>[0];
    onEdit?: () => void;
}) { return <>{publicReviewRows(terms).map(({ label, value }) => <section className={styles.row} key={label}>{onEdit ? <button type="button" className={styles.link} onClick={onEdit}>{label} · Изменить →</button> : <span>{label}</span>}<p>{value}</p></section>)}</>; }
function ChangeRows({ before, after }: {
    before: Parameters<typeof moderationChanges>[0];
    after: Parameters<typeof moderationChanges>[1];
}) { const changes = moderationChanges(before, after); return changes.length ? <>{changes.map((row) => <section className={styles.row} key={row.label}><span>{row.label} · изменено</span><p>Было: {row.before || 'Не указано'}<br />Стало: {row.after || 'Не указано'}</p></section>)}</> : <p>Без изменений.</p>; }
export function ModerationFields({ draft, errors, onChange, onValidate, startOnly = false }: {
    startOnly?: boolean;
    draft: EventDraft;
    errors: DraftErrors;
    onChange: (key: keyof EventDraft, value: string) => void;
    onValidate?: (key: keyof EventDraft) => void;
}) {
    const field = (key: keyof EventDraft, label: string, multiline = false, type = 'text') => <TextField key={key} id={`mod-${key}`} className={styles.field} label={label} value={String(draft[key] ?? '')} onChange={(value) => onChange(key, value)} onBlur={() => onValidate?.(key)} multiline={multiline} rows={multiline ? 2 : undefined} type={type} aria-invalid={Boolean(errors[key])} hint={errors[key]}/>;
    return <>
    {field('question', 'Название события', true)}{field('outcomeA', 'Первый исход')}{field('outcomeB', 'Второй исход')}
    <label className={styles.select}>Категория<select value={draft.category} onChange={(event) => onChange('category', event.target.value)}>{[['sport', 'Спорт'], ['esports', 'Киберспорт'], ['politics', 'Политика'], ['crypto', 'Крипто'], ['unique', 'Другое']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    {field('description', 'Описание · необязательно', true)}<h2>Правила и критерии</h2>{field('rules', 'Подробные условия', true)}{field('criterionA', 'Когда наступает первый исход', true)}{field('criterionB', 'Когда наступает второй исход', true)}{field('method', 'Как будет определён результат', true)}{field('unverifiable', 'Если результат нельзя определить', true)}
    <h2>Источники проверки</h2>{field('sourceName', 'Основной источник · обязательно')}{field('sourceUrl', 'Ссылка на основной источник · обязательно', false, 'url')}{field('backupName', 'Резервный источник · необязательно')}{field('backupUrl', 'Ссылка на резервный источник · необязательно', false, 'url')}
    <h2>Сроки · UTC</h2>{field('closeAt', startOnly ? 'Дата и время начала' : 'Приём ставок до', false, 'datetime-local')}{!startOnly ? field('endsAt', 'Предполагаемое завершение события', false, 'datetime-local') : null}
  </>;
}
function Shell({ title, context, onBack, footer, children }: {
    title: string;
    context?: string;
    onBack: () => void;
    footer?: ReactNode;
    children: ReactNode;
}) { return <div className={styles.screen}><header className={styles.header}><div className={styles.navigation}><button type="button" onClick={onBack}>← Назад</button><span>BetTON</span></div><h1>{title}</h1>{context ? <p>{context}</p> : null}</header><main className={styles.body}>{children}</main>{footer ? <footer className={styles.footer}>{footer}</footer> : null}</div>; }
