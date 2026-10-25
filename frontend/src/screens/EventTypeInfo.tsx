import { Button } from '../components/Button/Button'
import { useI18n } from '../i18n'
import { OnboardingArtImage as Art } from './OnboardingAssets'
import styles from './EventTypeInfo.module.css'

export type EventType = 'public' | 'private' | 'guarantor'
export type EventTypeInfoProps = { kind: EventType; onClose: () => void }
export const EVENT_TYPE_FIGMA_FRAMES = { public: '304:2146', private: '304:2190', guarantor: '304:2231' } as const
const data = {
  public: { halo: '304:2147', hero: '304:2148', icons: ['304:2159', '304:2166', '304:2172', '304:2177'] },
  private: { halo: '304:2191', hero: '304:2192', icons: ['304:2200', '304:2207', '304:2213', '304:2219'] },
  guarantor: { halo: '304:2232', hero: '304:2233', icons: ['304:2244', '304:2251', '304:2257', '304:2262'] },
}
const copy = {
  ru: {
    public: { title: 'Публичное событие', caption: 'Для всех после модерации', rows: ['После одобрения модерацией доступно всем пользователям.', 'Модерация проверяет, можно ли однозначно определить исход.', 'Способ проверки и источник указаны в условиях события.', 'Результат определяется по опубликованным условиям.'] },
    private: { title: 'Частное без гаранта', caption: 'Участие по ссылке', rows: ['Доступно по ссылке тем, кто получил приглашение.', 'Результат подтверждает создатель события.', 'Ответственность за доверие и выбор лежит на участниках.', 'Перед ставкой прочитайте условия и убедитесь, что доверяете автору.'] },
    guarantor: { title: 'Частное с гарантом', caption: 'Независимая проверка результата', rows: ['Событие доступно участникам по ссылке.', 'Итог подтверждает выбранный независимый гарант.', 'Условия заранее согласуются с гарантом до начала ставок.', 'Гарант получает вознаграждение за выполненную работу.'] },
    final: ['Решение гаранта окончательное.', 'Участники выбирают, кому доверять.'], period: '24 часа после окончания события', expired: 'Нет решения — отмена и возврат ставок', close: 'Понятно',
  },
  en: {
    public: { title: 'Public event', caption: 'For everyone after moderation', rows: ['Available to all users after moderation approval.', 'Moderation checks whether the outcome can be determined objectively.', 'The verification method and source are set out in the event terms.', 'The result is determined under the published terms.'] },
    private: { title: 'Private, no guarantor', caption: 'Participation by link', rows: ['Available by link to those who received an invitation.', 'The event creator confirms the result.', 'Participants are responsible for deciding whom to trust.', 'Read the terms before betting and make sure you trust the creator.'] },
    guarantor: { title: 'Private with guarantor', caption: 'Independent result verification', rows: ['Participants access the event by link.', 'The selected independent guarantor confirms the result.', 'The terms are agreed with the guarantor before betting starts.', 'The guarantor receives a reward for their work.'] },
    final: ['The guarantor’s decision is final.', 'Participants choose whom to trust.'], period: '24 hours after the event ends', expired: 'No decision — cancellation and refunds', close: 'Got it',
  },
  zh: {
    public: { title: '公开事件', caption: '审核后向所有人开放', rows: ['审核通过后向所有用户开放。', '审核会检查是否能够明确判定结果。', '事件条件中说明验证方法和信息来源。', '按照已发布的条件确定结果。'] },
    private: { title: '无担保人的私人事件', caption: '凭链接参与', rows: ['收到邀请的人可通过链接参与。', '事件创建者确认结果。', '参与者自行决定信任谁，并承担选择责任。', '投注前阅读条件，确保信任创建者。'] },
    guarantor: { title: '有担保人的私人事件', caption: '独立验证结果', rows: ['参与者通过链接访问事件。', '选定的独立担保人确认结果。', '开始投注前，与担保人协商事件条件。', '担保人完成工作后获得报酬。'] },
    final: ['担保人的决定为最终决定。', '参与者自行选择信任谁。'], period: '事件结束后24小时内', expired: '未作决定则取消事件并退还投注', close: '明白了',
  },
}

/** Shared by onboarding and event creation. Closing returns to the caller's selection. */
export function EventTypeInfo({ kind, onClose }: EventTypeInfoProps) {
  const { locale } = useI18n()
  const c = copy[locale]
  const content = c[kind]
  const assets = data[kind]
  return <div className={`${styles.screen} ${styles[kind]}`} data-figma-frame={EVENT_TYPE_FIGMA_FRAMES[kind]}>
    <div className={styles.hero}><Art node={assets.halo} width={225} height={190} className={styles.halo} /><Art node={assets.hero} width={170} height={144} className={styles.heroIcon} /></div>
    <h1>{content.title}</h1><p className={styles.caption}>{content.caption}</p>
    <ul className={styles.conditions}>{content.rows.map((row, index) => <li key={row}><span className={styles.icon}><Art node={assets.icons[index]!} width={24} height={24} /></span><span>{row}</span></li>)}</ul>
    {kind === 'guarantor' ? <><p className={styles.final}>{c.final[0]}<br />{c.final[1]}</p><div className={styles.period}><p>{c.period}</p><p>{c.expired}</p></div></> : null}
    <footer className={styles.footer}><Button fullWidth onClick={onClose} className={styles.close}>{c.close}</Button></footer>
  </div>
}
