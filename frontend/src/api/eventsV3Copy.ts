import type { Locale } from "../i18n";

/** Scope-specific copy; values supplied by users and unknown server errors are never translated. */
const COPY: Record<string, readonly [string, string]> = {
  "Создать событие": ["Create event", "创建事件"],
  "Вопрос и исходы": ["Question and outcomes", "问题与结果"],
  "Условия и сроки": ["Rules and timing", "规则与时间"],
  "Проверка события": ["Review event", "检查事件"],
  "Выберите гаранта": ["Choose a guarantor", "选择担保人"],
  "Публичное событие": ["Public event", "公开事件"],
  "Частное по ссылке": ["Private event by link", "凭链接访问的私人事件"],
  "Частное без гаранта": [
    "Private event without a guarantor",
    "无担保人的私人事件",
  ],
  "Частное с гарантом": [
    "Private event with a guarantor",
    "有担保人的私人事件",
  ],
  "Доступно всем после проверки модерацией": [
    "Available to everyone after moderation",
    "审核通过后向所有人开放",
  ],
  "Результат определяет создатель события": [
    "The creator determines the result",
    "由创建者确定结果",
  ],
  "Выбранный гарант принимает окончательное решение": [
    "The chosen guarantor makes the final decision",
    "选定的担保人作出最终决定",
  ],
  "1 из 3 · Тип события": ["1 of 3 · Event type", "第1步，共3步 · 事件类型"],
  "2 из 3": ["2 of 3", "第2步，共3步"],
  "3 из 3": ["3 of 3", "第3步，共3步"],
  "Тип события": ["Event type", "事件类型"],
  Продолжить: ["Continue", "继续"],
  Далее: ["Next", "下一步"],
  "Проверить событие": ["Review event", "检查事件"],
  "Пригласить гаранта": ["Invite guarantor", "邀请担保人"],
  "Отправить на модерацию": ["Submit for moderation", "提交审核"],
  "Создать событие по ссылке": ["Create private event", "创建链接事件"],
  "Выбрать гаранта": ["Choose guarantor", "选择担保人"],
  "← События": ["← Events", "← 事件"],
  "← Назад": ["← Back", "← 返回"],
  "Профиль гаранта": ["Guarantor profile", "担保人资料"],
  "Рейтинг, отзывы и история проверок": [
    "Rating, reviews and verification history",
    "评分、评价和验证记录",
  ],
  "Чтобы создать событие, откройте BetTON через Telegram и войдите в профиль.":
    [
      "To create an event, open BetTON in Telegram and sign in.",
      "要创建事件，请在Telegram中打开BetTON并登录。",
    ],
  "Подробнее →": ["Learn more →", "了解更多 →"],
  "Название события": ["Event title", "事件名称"],
  "Первый исход": ["First outcome", "第一个结果"],
  "Второй исход": ["Second outcome", "第二个结果"],
  Категория: ["Category", "分类"],
  Спорт: ["Sports", "体育"],
  Киберспорт: ["Esports", "电子竞技"],
  Политика: ["Politics", "政治"],
  Крипто: ["Crypto", "加密货币"],
  Другое: ["Other", "其他"],
  "Описание · необязательно": ["Description · optional", "描述 · 选填"],
  "Правила и критерии": ["Rules and criteria", "规则与判定标准"],
  "Подробные условия": ["Detailed rules", "详细规则"],
  "Правила события": ["Event rules", "事件规则"],
  "Когда наступает первый исход": [
    "When the first outcome occurs",
    "第一个结果的判定条件",
  ],
  "Когда наступает второй исход": [
    "When the second outcome occurs",
    "第二个结果的判定条件",
  ],
  "Как создатель определит победителя": [
    "How the creator determines the winner",
    "创建者如何确定获胜方",
  ],
  "Как будет определён результат": [
    "How the result will be determined",
    "如何确定结果",
  ],
  "Если результат нельзя определить": [
    "If the result cannot be determined",
    "无法确定结果时",
  ],
  "Источники проверки": ["Verification sources", "验证来源"],
  "Основной источник · название": ["Primary source · name", "主要来源 · 名称"],
  "Основной источник · ссылка": ["Primary source · link", "主要来源 · 链接"],
  "Резервный источник · название · необязательно": [
    "Backup source · name · optional",
    "备用来源 · 名称 · 选填",
  ],
  "Резервный источник · ссылка · необязательно": [
    "Backup source · link · optional",
    "备用来源 · 链接 · 选填",
  ],
  "Резервный источник используется, если основной недоступен или не даёт нужных сведений по правилам события.":
    [
      "The backup source is used if the primary source is unavailable or lacks the information required by the event rules.",
      "当主要来源不可用或无法提供事件规则要求的信息时，使用备用来源。",
    ],
  "Материалы для проверки · необязательно": [
    "Verification materials · optional",
    "验证材料 · 选填",
  ],
  "Сроки · UTC": ["Timing · UTC", "时间 · UTC"],
  "Приём ставок до": ["Betting closes at", "投注截止时间"],
  "Предполагаемое окончание события": [
    "Expected event end",
    "预计事件结束时间",
  ],
  "Гарант принимает решение в течение 24 часов после окончания события.": [
    "The guarantor decides within 24 hours after the event ends.",
    "担保人在事件结束后24小时内作出决定。",
  ],
  "Результат определяет создатель по условиям события.": [
    "The creator determines the result under the event rules.",
    "创建者根据事件规则确定结果。",
  ],
  "Событие появится в ленте после одобрения модерацией.": [
    "The event appears in the feed after moderation approval.",
    "事件审核通过后将出现在列表中。",
  ],
  Изменить: ["Edit", "编辑"],
  "Правила и результат": ["Rules and result", "规则与结果"],
  Материалы: ["Materials", "材料"],
  Источники: ["Sources", "来源"],
  Резервный: ["Backup", "备用"],
  "Окончание события": ["Event end", "事件结束"],
  "Решение гаранта": ["Guarantor decision", "担保人的决定"],
  "Гарант будет выбран далее. Срок решения — 24 часа после окончания события. При отсутствии своевременного решения — отмена события и возврат ставок.":
    [
      "You will choose a guarantor next. The decision is due within 24 hours after the event ends. If no timely decision is made, the event is cancelled and stakes are returned.",
      "下一步选择担保人。决定期限为事件结束后24小时。若未及时作出决定，事件将取消并退还投注。",
    ],
  "После начала приёма ставок изменить условия события нельзя.": [
    "Event rules cannot be changed after betting opens.",
    "开始接受投注后无法修改事件规则。",
  ],
  "Сначала можно посмотреть профиль. Условия и вознаграждение обсуждаются в чате после приглашения.":
    [
      "You can view the profile first. Rules and remuneration are discussed in chat after the invitation.",
      "您可以先查看资料。邀请后可在聊天中讨论规则和报酬。",
    ],
  "Загружаем гарантов…": ["Loading guarantors…", "正在加载担保人…"],
  "Не удалось загрузить список гарантов.": [
    "Could not load guarantors.",
    "无法加载担保人列表。",
  ],
  Повторить: ["Retry", "重试"],
  "Гарантов пока нет. Черновик сохранён — можно вернуться позже.": [
    "No guarantors yet. Your draft is saved; you can return later.",
    "暂无担保人。草稿已保存，可稍后返回。",
  ],
  "Принимает события": ["Accepting events", "接受事件"],
  "Сейчас недоступен": ["Unavailable now", "目前不可用"],
  "Профиль →": ["Profile →", "资料 →"],
  "Специализация не указана": ["No specialisation specified", "未注明专长"],
  "Пока без оценок": ["No ratings yet", "暂无评分"],
  "из 5": ["out of 5", "分（满分5分）"],
  проверок: ["verifications", "次验证"],
  "Выбран гарант": ["Selected guarantor", "已选担保人"],
  "Ставки откроются после согласования условий.": [
    "Betting opens after the rules are agreed.",
    "规则达成一致后开放投注。",
  ],
  "Данные сохранены. Проверьте подключение и повторите отправку.": [
    "Your draft is saved. Check your connection before trying again.",
    "草稿已保存。请检查网络连接后重试。",
  ],
  "Выберите тип события": ["Choose an event type", "请选择事件类型"],
  "От 8 до 512 символов": ["Use 8–512 characters", "请输入8至512个字符"],
  "Укажите первый исход": ["Enter the first outcome", "请输入第一个结果"],
  "Укажите второй исход": ["Enter the second outcome", "请输入第二个结果"],
  "Исходы должны различаться": ["Outcomes must differ", "两个结果必须不同"],
  "Не более 128 символов": ["Maximum 128 characters", "最多128个字符"],
  "Не более 200 символов": ["Maximum 200 characters", "最多200个字符"],
  "Не более 4000 символов": ["Maximum 4,000 characters", "最多4000个字符"],
  "Опишите правила события": ["Describe the event rules", "请描述事件规则"],
  "Укажите, как будет определён результат": [
    "Explain how the result will be determined",
    "请说明如何确定结果",
  ],
  "Описание и материалы вместе должны содержать не более 4000 символов": [
    "Description and materials together must not exceed 4,000 characters",
    "描述与材料合计最多4000个字符",
  ],
  "Укажите дату и время окончания приёма ставок": [
    "Enter the betting closing date and time",
    "请输入投注截止日期和时间",
  ],
  "Выберите время в будущем": [
    "Choose a future date and time",
    "请选择未来的日期和时间",
  ],
  "Укажите предполагаемое окончание события": [
    "Enter the expected event end",
    "请输入预计事件结束时间",
  ],
  "Окончание события не может быть раньше окончания приёма ставок": [
    "The event cannot end before betting closes",
    "事件结束时间不能早于投注截止时间",
  ],
  "Укажите критерий первого исхода": [
    "Enter the first outcome criterion",
    "请输入第一个结果的判定标准",
  ],
  "Укажите критерий второго исхода": [
    "Enter the second outcome criterion",
    "请输入第二个结果的判定标准",
  ],
  "Укажите порядок действий, если результат нельзя определить": [
    "Explain what happens if the result cannot be determined",
    "请说明无法确定结果时的处理方式",
  ],
  "Укажите название основного источника": [
    "Enter the primary source name",
    "请输入主要来源名称",
  ],
  "Укажите ссылку на основной источник": [
    "Enter the primary source link",
    "请输入主要来源链接",
  ],
  "Введите ссылку, начинающуюся с https:// или http://": [
    "Enter a link starting with https:// or http://",
    "请输入以https://或http://开头的链接",
  ],
  "Укажите название резервного источника": [
    "Enter the backup source name",
    "请输入备用来源名称",
  ],
  "Укажите корректную ссылку резервного источника": [
    "Enter a valid backup source link",
    "请输入有效的备用来源链接",
  ],
  "Гарант сейчас недоступен. Выберите другого": [
    "This guarantor is unavailable. Choose another one",
    "该担保人目前不可用，请选择其他担保人",
  ],
  "Приглашение по ссылке": ["Invite by link", "通过链接邀请"],
  "Ожидает модерации": ["Awaiting moderation", "等待审核"],
  "Приглашение отправлено": ["Invitation sent", "邀请已发送"],
  "Событие создано": ["Event created", "事件已创建"],
  "Событие отклонено": ["Event rejected", "事件被拒绝"],
  "Состояние события": ["Event status", "事件状态"],
  "Частное по ссылке · Без гаранта": [
    "Private by link · Without a guarantor",
    "凭链接访问 · 无担保人",
  ],
  "Ссылка на событие": ["Event link", "事件链接"],
  "Событие доступно тем, у кого есть ссылка. Перед первой ставкой участники увидят правила и имя создателя.":
    [
      "The event is accessible to anyone with the link. Before their first bet, participants see the rules and creator’s name.",
      "持有链接的人可访问事件。参与者首次投注前会看到规则和创建者姓名。",
    ],
  "Ссылка скопирована": ["Link copied", "链接已复制"],
  "Не удалось скопировать. Выделите ссылку и скопируйте вручную.": [
    "Could not copy. Select the link and copy it manually.",
    "无法复制。请选中链接并手动复制。",
  ],
  "Копировать ссылку": ["Copy link", "复制链接"],
  "Меню отправки недоступно. Скопируйте ссылку вручную.": [
    "Sharing is unavailable. Copy the link manually.",
    "分享菜单不可用。请手动复制链接。",
  ],
  Поделиться: ["Share", "分享"],
  "Событие отправлено на проверку": [
    "Event submitted for review",
    "事件已提交审核",
  ],
  "Модерация проверит условия и возможность установить результат.": [
    "Moderation will check the rules and whether the result can be verified.",
    "审核人员将检查规则以及结果是否能够验证。",
  ],
  "Ставки откроются после одобрения.": [
    "Betting opens after approval.",
    "审核通过后开放投注。",
  ],
  "Ждём ответа гаранта": ["Waiting for the guarantor", "等待担保人回复"],
  "Откройте событие, чтобы обсудить и согласовать условия в чате.": [
    "Open the event to discuss and agree the rules in chat.",
    "打开事件，在聊天中讨论并确认规则。",
  ],
  "Приём ставок пока закрыт.": ["Betting is not open yet.", "暂未开放投注。"],
  Событие: ["Event", "事件"],
  Результат: ["Result", "结果"],
  "Определяет создатель по опубликованным условиям.": [
    "Determined by the creator under the published rules.",
    "由创建者根据已发布的规则确定。",
  ],
  "Подтверждается в соответствии с утверждёнными правилами события.": [
    "Confirmed under the approved event rules.",
    "根据已批准的事件规则确认。",
  ],
  "Причина отклонения": ["Rejection reason", "拒绝原因"],
  "Текущий статус": ["Current status", "当前状态"],
  "Открыть событие": ["Open event", "打开事件"],
  "К моим событиям": ["My events", "我的事件"],
  "К согласованию условий": ["Discuss the rules", "协商规则"],
  "Пригласить участников": ["Invite participants", "邀请参与者"],
  "К событиям": ["Events", "事件列表"],
};

export function eventCopy(locale: Locale, source: string | undefined): string {
  if (!source) return "";
  return locale === "ru"
    ? source
    : (COPY[source]?.[locale === "en" ? 0 : 1] ?? source);
}
