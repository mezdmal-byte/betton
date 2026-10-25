import { Button } from '../components/Button/Button'
import { TextField } from '../components/TextField/TextField'

export function GuarantorCancellationForm({ reason, confirming, pending, available, onReasonChange, onReview, onConfirm, onEdit }: {
  reason: string;
  confirming: boolean;
  pending: boolean;
  available: boolean;
  onReasonChange: (value: string) => void;
  onReview: () => void;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  return <>
    <p>Отмена без определения победителя: исполненные ставки будут возвращены, неисполненные предложения отменены.</p>
    <p>Вознаграждение гаранту и сервисный сбор при отмене не начисляются.</p>
    {!available ? <p role="status">Отмена гарантом доступна только в течение 24 часов после окончания события.</p> : null}
    {confirming ? <><h3>Подтвердите отмену события</h3><p>Основание: {reason}</p><Button fullWidth disabled={pending || !available || !reason.trim() || reason.length > 1000} loading={pending} onClick={onConfirm}>Отменить событие и вернуть ставки</Button><Button variant="secondary" fullWidth disabled={pending} onClick={onEdit}>Изменить основание</Button></> : <><TextField label="Почему результат нельзя определить" value={reason} onChange={onReasonChange} multiline maxLength={1000} disabled={pending}/><Button fullWidth disabled={pending || !available || !reason.trim() || reason.length > 1000} onClick={onReview}>Проверить отмену</Button></>}
  </>
}
