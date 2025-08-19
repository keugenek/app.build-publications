from app.birthday_card import BirthdayCard


def test_birthday_card_initialization():
    """Test that BirthdayCard initializes with default values"""
    card = BirthdayCard()

    assert card.birthday_person == "Friend"
    assert card.custom_message == "🎉 Happy Birthday! 🎉"
    assert len(card.photos) == 6
    assert not card.confetti_active

    # Verify all photo URLs are valid format
    for photo in card.photos:
        assert photo.startswith("https://")
        assert "picsum.photos" in photo


def test_customize_message():
    """Test message customization functionality"""
    card = BirthdayCard()

    # Test with valid inputs
    card.customize_message("Alice", "Have a wonderful birthday!")
    assert card.birthday_person == "Alice"
    assert card.custom_message == "Have a wonderful birthday!"

    # Test with empty inputs (should use defaults)
    card.customize_message("", "")
    assert card.birthday_person == "Friend"
    assert card.custom_message == "🎉 Happy Birthday! 🎉"

    # Test with None inputs
    card.customize_message(None, None)
    assert card.birthday_person == "Friend"
    assert card.custom_message == "🎉 Happy Birthday! 🎉"


def test_customize_message_partial():
    """Test customization with only one field provided"""
    card = BirthdayCard()

    # Only name provided
    card.customize_message("Bob", "")
    assert card.birthday_person == "Bob"
    assert card.custom_message == "🎉 Happy Birthday! 🎉"

    # Only message provided
    card.customize_message("", "Special birthday wishes!")
    assert card.birthday_person == "Friend"
    assert card.custom_message == "Special birthday wishes!"


def test_confetti_animation_css():
    """Test that confetti animation CSS is properly generated"""
    card = BirthdayCard()
    css = card.create_confetti_animation()

    # Verify essential CSS elements are present
    assert ".confetti" in css
    assert "@keyframes confetti-fall" in css
    assert ".balloon" in css
    assert "@keyframes balloon-float" in css
    assert ".birthday-title" in css
    assert "@keyframes gradient-shift" in css
    assert ".photo-card" in css
    assert ".celebration-button" in css

    # Verify animation properties
    assert "animation: confetti-fall 3s linear infinite" in css
    assert "animation: balloon-float 6s ease-in-out infinite" in css


def test_photo_gallery_structure():
    """Test that photo gallery has correct structure"""
    card = BirthdayCard()

    # Verify we have photos
    assert len(card.photos) > 0

    # Verify photo URLs are unique
    assert len(set(card.photos)) == len(card.photos)

    # Verify photo URLs contain random parameter for variety
    for photo in card.photos:
        assert "random=" in photo


def test_confetti_state_management():
    """Test confetti activation state"""
    card = BirthdayCard()

    # Initially should be inactive
    assert not card.confetti_active

    # Test state change (would normally be changed in trigger_celebration)
    card.confetti_active = True
    assert card.confetti_active


def test_birthday_card_customization_edge_cases():
    """Test edge cases for birthday card customization"""
    card = BirthdayCard()

    # Test with very long name
    long_name = "A" * 100
    card.customize_message(long_name, "Short message")
    assert card.birthday_person == long_name
    assert card.custom_message == "Short message"

    # Test with very long message
    long_message = "Happy birthday! " * 50
    card.customize_message("John", long_message)
    assert card.birthday_person == "John"
    assert card.custom_message == long_message

    # Test with special characters
    card.customize_message("José María", "¡Feliz cumpleaños! 🎉🎂🎈")
    assert card.birthday_person == "José María"
    assert card.custom_message == "¡Feliz cumpleaños! 🎉🎂🎈"


def test_default_photo_urls():
    """Test that default photo URLs are properly formatted"""
    card = BirthdayCard()

    expected_photos = [
        "https://picsum.photos/300/300?random=1",
        "https://picsum.photos/300/300?random=2",
        "https://picsum.photos/300/300?random=3",
        "https://picsum.photos/300/300?random=4",
        "https://picsum.photos/300/300?random=5",
        "https://picsum.photos/300/300?random=6",
    ]

    assert card.photos == expected_photos


def test_birthday_card_methods_exist():
    """Test that all required methods exist on BirthdayCard"""
    card = BirthdayCard()

    # Test method existence
    assert hasattr(card, "create_confetti_animation")
    assert hasattr(card, "create_photo_gallery")
    assert hasattr(card, "trigger_celebration")
    assert hasattr(card, "create_personalized_message")
    assert hasattr(card, "create_celebration_controls")
    assert hasattr(card, "customize_message")

    # Test methods are callable
    assert callable(card.create_confetti_animation)
    assert callable(card.create_photo_gallery)
    assert callable(card.trigger_celebration)
    assert callable(card.create_personalized_message)
    assert callable(card.create_celebration_controls)
    assert callable(card.customize_message)
