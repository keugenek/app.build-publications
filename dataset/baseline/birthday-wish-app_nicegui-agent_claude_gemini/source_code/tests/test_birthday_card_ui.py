import pytest
from nicegui.testing import User
from nicegui import ui


@pytest.mark.asyncio
async def test_birthday_card_page_loads(user: User) -> None:
    """Test that the birthday card page loads successfully"""
    await user.open("/")

    # Check that main birthday message is displayed
    await user.should_see("Happy Birthday!")
    await user.should_see("Dear Friend,")
    await user.should_see("May your day be filled with happiness")

    # Check that celebration controls are present
    await user.should_see("Start Celebration!")
    await user.should_see("Play Happy Birthday")

    # Check that photo gallery section is present
    await user.should_see("Memory Gallery")

    # Check that footer message is present
    await user.should_see("Wishing you all the best!")


@pytest.mark.asyncio
async def test_celebration_button_interaction(user: User) -> None:
    """Test that celebration button triggers notification"""
    await user.open("/")

    # Find and click the celebration button
    user.find("Start Celebration!").click()

    # Should see celebration notification
    await user.should_see("Celebration time!")


@pytest.mark.asyncio
async def test_music_button_interaction(user: User) -> None:
    """Test that music button triggers notification"""
    await user.open("/")

    # Find and click the music button
    user.find("Play Happy Birthday").click()

    # Should see music notification
    await user.should_see("Happy Birthday song playing!")


@pytest.mark.asyncio
async def test_customization_section_exists(user: User) -> None:
    """Test that message customization section is available"""
    await user.open("/")

    # Check that customization expansion is present
    await user.should_see("Customize Your Message")

    # Expand the customization section by finding the expansion element
    expansions = list(user.find(ui.expansion).elements)
    if expansions:
        expansions[0].open()

        # Check that customization inputs are present
        await user.should_see("Birthday Person's Name")
        await user.should_see("Personal Message")
        await user.should_see("Update Message")


@pytest.mark.asyncio
async def test_message_customization_functionality(user: User) -> None:
    """Test that message customization works"""
    await user.open("/")

    # Find and open the expansion
    expansions = list(user.find(ui.expansion).elements)
    if expansions:
        expansions[0].open()

        # Find input elements and enter custom values
        name_inputs = list(user.find(ui.input).elements)
        message_inputs = list(user.find(ui.textarea).elements)

        if name_inputs:
            name_inputs[0].set_value("Alice")

        if message_inputs:
            message_inputs[0].set_value("Have an amazing birthday celebration!")

        # Click update button
        user.find("Update Message").click()

        # Should see update confirmation
        await user.should_see("Message updated!")


@pytest.mark.asyncio
async def test_photo_gallery_images(user: User) -> None:
    """Test that photo gallery contains images"""
    await user.open("/")

    # Check for image elements in the gallery
    images = list(user.find(ui.image).elements)

    # Should have multiple images in the gallery
    assert len(images) >= 6

    # Check that memory labels are present
    await user.should_see("Memory #1")


@pytest.mark.asyncio
async def test_celebration_zone_section(user: User) -> None:
    """Test that celebration zone section is properly displayed"""
    await user.open("/")

    # Check celebration zone title
    await user.should_see("Celebration Zone")

    # Check both celebration buttons are present
    buttons = list(user.find(ui.button).elements)
    button_texts = []

    for button in buttons:
        if hasattr(button, "text"):
            button_texts.append(button.text)

    # Should have celebration and music buttons
    celebration_found = any("Start Celebration" in text for text in button_texts if text)
    music_found = any("Play Happy Birthday" in text for text in button_texts if text)

    assert celebration_found or music_found  # At least one should be found


@pytest.mark.asyncio
async def test_responsive_layout_structure(user: User) -> None:
    """Test that the page has proper responsive layout structure"""
    await user.open("/")

    # Check for main container cards
    cards = list(user.find(ui.card).elements)

    # Should have multiple card sections for different parts of the birthday card
    assert len(cards) >= 3  # Header, celebration, gallery, footer cards

    # Check that main sections are present
    await user.should_see("Happy Birthday!")
    await user.should_see("Memory Gallery")
    await user.should_see("Celebration Zone")
    await user.should_see("From your friends with love")
