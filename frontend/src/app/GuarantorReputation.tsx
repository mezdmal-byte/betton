import { ArrowLeft, BadgeCheck, MessageSquareText, ShieldCheck, Star, UserRound } from "lucide-react";
import type { Guarantor } from "../api/guarantors";
import { Button } from "../components/Button/Button";
import s from "./Guarantors.module.css";

function formatRating(value: number | null): string {
  return value == null ? "—" : value.toFixed(1).replace(".", ",");
}

function specializations(topics: string): string[] {
  return topics.split(/[,;\n]+/).map((v) => v.trim()).filter(Boolean).slice(0, 8);
}

function Role({ guarantor: g }: { guarantor: Guarantor }) {
  if (g.is_moderator) {
    return <span className={s.roleModerator}><ShieldCheck size={14} /> Модератор BetTON</span>;
  }
  if (g.high_reputation) {
    return <span className={s.roleReputation}><BadgeCheck size={14} /> Высокая репутация</span>;
  }
  return <span className={s.roleOrdinary}>Гарант BetTON</span>;
}

function Status({ guarantor: g }: { guarantor: Guarantor }) {
  return <span className={g.available ? s.online : s.offline}>
    <span className={s.statusDot} />
    {g.available ? "Принимает пари" : "Сейчас недоступен"}
  </span>;
}

export function GuarantorCard({ guarantor: g, onOpen }: {
  guarantor: Guarantor;
  onOpen: () => void;
}) {
  return (
    <button type="button" className={s.directoryCard} onClick={onOpen}
      aria-label={`Открыть карточку гаранта ${g.name}`}>
      <div className={s.directoryCardTop}>
        <span className={s.avatar}><UserRound size={22} /></span>
        <div className={s.identity}>
          <strong>{g.name}</strong>
          <Role guarantor={g} />
        </div>
        <span className={s.chevron} aria-hidden="true">›</span>
      </div>
      <Status guarantor={g} />
      <div className={s.directoryStats}>
        <span><Star size={15} fill="currentColor" /> <b>{formatRating(g.rating)}</b> <small>({g.review_count})</small></span>
        <span>{g.completed} проверок</span>
        <span>{g.disputes} споров</span>
      </div>
      {g.topics.trim() ? <p className={s.directoryTopics}>{g.topics}</p> : null}
      <span className={s.openCard}>Подробнее о гаранте <span aria-hidden="true">→</span></span>
    </button>
  );
}

export function GuarantorDetails({ guarantor: g, onBack, onCreate, onChoose }: {
  guarantor: Guarantor;
  onBack: () => void;
  onCreate?: () => void;
  onChoose?: () => void;
}) {
  const categories = specializations(g.topics);
  return (
    <div className={s.detail}>
      <button type="button" className={s.textBack} onClick={onBack}>
        <ArrowLeft size={19} /> Все гаранты
      </button>
      <div className={s.profileHero}>
        <div className={s.avatarLarge}><UserRound size={30} /></div>
        <h1>{g.name}</h1>
        <Role guarantor={g} />
        <Status guarantor={g} />
      </div>

      <section className={s.reputationCard} aria-label="Рейтинг гаранта">
        <div className={s.ratingHero}>
          <div>
            <div className={s.ratingNumber}>{formatRating(g.rating)} <Star size={27} fill="currentColor" /></div>
            <p>{g.review_count ? `На основе ${g.review_count} оценок участников` : "Пока нет оценок участников"}</p>
          </div>
          <MessageSquareText size={25} className={s.subtleIcon} />
        </div>
        <div className={s.ratingRows} aria-label="Распределение оценок">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = g.rating_distribution[String(stars)] ?? 0;
            const share = g.review_count ? Math.round((count / g.review_count) * 100) : 0;
            return (
              <div className={s.ratingRow} key={stars}>
                <span>{stars} <Star size={11} fill="currentColor" /></span>
                <div className={s.ratingTrack}>
                  <div className={s.ratingFill} style={{ width: `${share}%` }} />
                </div>
                <small>{count}</small>
              </div>
            );
          })}
        </div>
      </section>

      <section className={s.panelPlain} aria-label="Статистика проверок">
        <h2>Статистика</h2>
        <div className={s.metricGrid}>
          <div><strong>{g.completed}</strong><span>Завершено пари</span></div>
          <div><strong>{g.review_count}</strong><span>Отзывов</span></div>
          <div><strong>{g.disputes}</strong><span>Спорных пари</span></div>
        </div>
        <p className={s.explain}>Споры учитываются по зафиксированным обращениям. Высокая оценка не гарантирует правильность будущих решений.</p>
      </section>

      {g.high_reputation && !g.is_moderator ? (
        <section className={s.reputationExplain}>
          <BadgeCheck size={20} />
          <div>
            <strong>Высокая репутация</strong>
            <p>Автоматический статус: не менее 10 завершённых пари, 5 отзывов, оценка от 4,5 и не более одного спора. Это не удостоверение личности и не гарантия результата.</p>
          </div>
        </section>
      ) : null}
      {g.is_moderator ? (
        <section className={s.reputationExplain}>
          <ShieldCheck size={20} />
          <div>
            <strong>Модератор BetTON</strong>
            <p>Роль назначена площадкой. Полномочия модерации отделены от оценок за работу гарантом.</p>
          </div>
        </section>
      ) : null}

      <section className={s.panelPlain}>
        <h2>О гаранте</h2>
        <p className={s.bio}>{g.bio.trim() || "Гарант пока не добавил описание о себе."}</p>
        <h3>Какие события проверяет</h3>
        {categories.length ? (
          <div className={s.chips}>{categories.map((topic) => <span key={topic}>{topic}</span>)}</div>
        ) : <p className={s.muted}>Специализация пока не указана.</p>}
      </section>

      <section className={s.panelPlain}>
        <div className={s.reviewTitle}>
          <h2>Отзывы участников</h2>
          <span>{g.review_count}</span>
        </div>
        {g.reviews.length ? (
          <div className={s.reviews}>
            {g.reviews.map((review, index) => (
              <article className={s.review} key={index}>
                <div className={s.reviewHead}>
                  <span className={s.reviewAvatar}><UserRound size={17} /></span>
                  <strong>Участник пари</strong>
                  <span className={s.reviewStars} aria-label={`Оценка ${review.rating} из 5`}>
                    {"★".repeat(review.rating)}<span>{"☆".repeat(5 - review.rating)}</span>
                  </span>
                </div>
                <p>{review.text.trim() || "Оценка без комментария."}</p>
              </article>
            ))}
            {g.review_count > g.reviews.length ? (
              <p className={s.muted}>Показаны последние {g.reviews.length} отзывов.</p>
            ) : null}
          </div>
        ) : (
          <p className={s.muted}>Отзывов пока нет. Оценку могут оставить только участники завершённого пари.</p>
        )}
      </section>

      <div className={s.profileAction}>
        <Button fullWidth onClick={onChoose ?? onCreate} disabled={!g.available}>{onChoose ? "Выбрать этого гаранта" : "Создать пари"}</Button>
        <small>{g.available ? (onChoose ? "Гарант будет приглашён после создания частного пари." : "Выбрать этого гаранта можно при создании частного пари.") : "Гарант пока не принимает новые запросы."}</small>
      </div>
    </div>
  );
}
