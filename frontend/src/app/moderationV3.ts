import { EMPTY_EVENT_DRAFT, type CreateEventBody, type EventDraft } from '../api/eventsV3';
const utcInput = (value: string) => new Date(value).toISOString().slice(0, 16);
export function moderationDraft(terms: CreateEventBody): EventDraft {
    return { ...EMPTY_EVENT_DRAFT, eventType: 'public', question: terms.question, outcomeA: terms.outcomes[0], outcomeB: terms.outcomes[1], category: terms.category ?? 'unique', description: terms.description, rules: terms.rules, criterionA: terms.criteria?.[0] ?? '', criterionB: terms.criteria?.[1] ?? '', method: terms.resolution_method, unverifiable: terms.unverifiable ?? '', sourceName: terms.primary_source?.name ?? '', sourceUrl: terms.primary_source?.url ?? '', backupName: terms.backup_source?.name ?? '', backupUrl: terms.backup_source?.url ?? '', closeAt: utcInput(terms.close_at), endsAt: utcInput(terms.ends_at) };
}
const categories: Record<string, string> = { sport: 'Спорт', sports: 'Спорт', esports: 'Киберспорт', politics: 'Политика', crypto: 'Крипто', unique: 'Другое' };
export function publicReviewRows(terms: CreateEventBody) {
    return [
        { label: 'Название, категория и исходы', value: `${terms.question}\n${categories[terms.category ?? 'unique']} · ${terms.outcomes.join(' / ')}` },
        { label: 'Описание', value: terms.description || 'Не указано' },
        { label: 'Правила и критерии', value: `${terms.rules}\nПервый исход: ${terms.criteria?.[0] ?? 'Не указано'}\nВторой исход: ${terms.criteria?.[1] ?? 'Не указано'}\nСпособ проверки: ${terms.resolution_method}` },
        { label: 'Источники', value: `Основной: ${terms.primary_source?.name ?? 'Не указан'}\n${terms.primary_source?.url ?? ''}${terms.backup_source ? `\nРезервный: ${terms.backup_source.name}\n${terms.backup_source.url}` : '\nРезервный: не указан'}` },
        { label: 'Сроки · UTC', value: `Приём ставок до ${utcInput(terms.close_at).replace('T', ', ')}\nЗавершение события: ${utcInput(terms.ends_at).replace('T', ', ')}` },
        { label: 'Если проверить результат невозможно', value: terms.unverifiable || 'Не указано' },
    ];
}
export function moderationChanges(before: CreateEventBody, after: CreateEventBody) {
    const rows = (terms: CreateEventBody) => [
        ['Название', terms.question], ['Первый исход', terms.outcomes[0]], ['Второй исход', terms.outcomes[1]], ['Категория', categories[terms.category ?? 'unique']], ['Описание', terms.description], ['Подробные условия', terms.rules], ['Критерий первого исхода', terms.criteria?.[0] ?? ''], ['Критерий второго исхода', terms.criteria?.[1] ?? ''], ['Как будет определён результат', terms.resolution_method], ['Если результат нельзя определить', terms.unverifiable ?? ''], ['Основной источник', terms.primary_source?.name ?? ''], ['Ссылка на основной источник', terms.primary_source?.url ?? ''], ['Резервный источник', terms.backup_source?.name ?? ''], ['Ссылка на резервный источник', terms.backup_source?.url ?? ''], ['Приём ставок до · UTC', utcInput(terms.close_at)], ['Завершение события · UTC', utcInput(terms.ends_at)],
    ];
    const oldRows = rows(before);
    return rows(after).flatMap(([label, value], index) => value === oldRows[index]?.[1] ? [] : [{ label: label!, before: oldRows[index]![1]!, after: value! }]);
}
