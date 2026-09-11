from bot.main import HELP_TEXT, START_TEXT


def test_bot_texts_describe_p2p_not_guaranteed_lmsr():
    start = START_TEXT.lower()
    help_text = HELP_TEXT.lower()
    assert "p2p" in start
    assert "lmsr" not in start
    assert "lmsr" not in help_text
    assert "чаевые" not in start
    assert "чаевые" not in help_text
    assert "без комиссии" not in start
    assert "ликвидность всегда есть" not in help_text
    assert "сервисный сбор" in start
    assert "встречн" in help_text
    assert "частичн" in help_text
    assert "отмен" in help_text
    assert "лимитн" in help_text
