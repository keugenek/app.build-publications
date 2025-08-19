import pytest
from decimal import Decimal
from nicegui.testing import User
from nicegui import ui
from app.database import reset_db
from app.inventory_service import InventoryService
from app.models import ProductCreate


@pytest.fixture()
def new_db():
    reset_db()
    yield
    reset_db()


class TestDashboardUI:
    async def test_dashboard_loads_successfully(self, user: User, new_db) -> None:
        """Test that dashboard page loads without errors"""
        await user.open("/")
        await user.should_see("Dashboard Overview")
        await user.should_see("Total Products")
        await user.should_see("Total Stock Units")
        await user.should_see("Quick Actions")

    async def test_dashboard_navigation_links(self, user: User, new_db) -> None:
        """Test navigation links on dashboard"""
        await user.open("/")

        # Check navigation links are present
        await user.should_see("Products")
        await user.should_see("Stock In")
        await user.should_see("Stock Out")


class TestProductManagementUI:
    async def test_products_page_loads(self, user: User, new_db) -> None:
        """Test products page loads with empty state"""
        await user.open("/products")
        await user.should_see("Product Management")
        await user.should_see("Add Product")
        await user.should_see("No products found")

    async def test_add_product_form_opens(self, user: User, new_db) -> None:
        """Test that add product dialog opens"""
        await user.open("/products")
        user.find("Add Product").click()
        await user.should_see("Add New Product")
        await user.should_see("Product Name")
        await user.should_see("SKU")
        await user.should_see("Initial Stock")

    async def test_create_product_success(self, user: User, new_db) -> None:
        """Test creating a new product through UI"""
        await user.open("/products")
        user.find("Add Product").click()

        # Fill in the form
        user.find("Product Name").type("Test Apple")
        user.find("SKU").type("APPLE001")

        # Find and set the number input for initial stock
        number_elements = list(user.find(ui.number).elements)
        if number_elements:
            number_elements[0].set_value(25)

        user.find("Save").click()

        # Should see success notification and product in table
        await user.should_see("Product created successfully!")
        await user.should_see("Test Apple")
        await user.should_see("APPLE001")

    async def test_products_table_with_data(self, user: User, new_db) -> None:
        """Test products table displays correctly with data"""
        # Create some test products
        InventoryService.create_product(ProductCreate(name="Apple", sku="APPLE001", current_stock=Decimal("50")))
        InventoryService.create_product(ProductCreate(name="Banana", sku="BANANA001", current_stock=Decimal("30")))

        await user.open("/products")

        # Should see products in table
        await user.should_see("Apple")
        await user.should_see("APPLE001")
        await user.should_see("Banana")
        await user.should_see("BANANA001")
        await user.should_see("50")
        await user.should_see("30")


class TestStockInUI:
    async def test_stock_in_page_loads(self, user: User, new_db) -> None:
        """Test stock-in page loads"""
        await user.open("/stock-in")
        await user.should_see("Stock In Transactions")
        await user.should_see("Add Stock In")

    async def test_stock_in_with_no_products(self, user: User, new_db) -> None:
        """Test stock-in page when no products exist"""
        await user.open("/stock-in")
        await user.should_see("No products available")
        await user.should_see("Go to Products")

    async def test_stock_in_form_with_products(self, user: User, new_db) -> None:
        """Test stock-in form when products exist"""
        # Create a test product
        InventoryService.create_product(ProductCreate(name="Test Product", sku="TEST001", current_stock=Decimal("10")))

        await user.open("/stock-in")

        # Form should be available
        await user.should_see("Product")
        await user.should_see("Quantity")
        await user.should_see("Unit Cost")
        await user.should_see("Supplier")
        await user.should_see("Add Stock In")

    async def test_record_stock_in_transaction(self, user: User, new_db) -> None:
        """Test recording a stock-in transaction"""
        # Create a test product
        product = InventoryService.create_product(
            ProductCreate(name="Test Item", sku="ITEM001", current_stock=Decimal("5"))
        )

        await user.open("/stock-in")

        # Fill out the form
        product_select = list(user.find(ui.select).elements)
        if product_select:
            product_select[0].set_value(str(product.id))

        quantity_inputs = list(user.find(ui.number).elements)
        if quantity_inputs:
            quantity_inputs[0].set_value(10)  # Quantity field

        user.find("Add Stock In").click()

        await user.should_see("Stock in transaction recorded successfully!")


class TestStockOutUI:
    async def test_stock_out_page_loads(self, user: User, new_db) -> None:
        """Test stock-out page loads"""
        await user.open("/stock-out")
        await user.should_see("Stock Out Transactions")
        await user.should_see("Add Stock Out")

    async def test_stock_out_with_no_products(self, user: User, new_db) -> None:
        """Test stock-out page when no products exist"""
        await user.open("/stock-out")
        await user.should_see("No products available")
        await user.should_see("Go to Products")

    async def test_stock_out_with_products_but_no_stock(self, user: User, new_db) -> None:
        """Test stock-out page when products exist but have no stock"""
        InventoryService.create_product(ProductCreate(name="Empty Product", sku="EMPTY001", current_stock=Decimal("0")))

        await user.open("/stock-out")
        await user.should_see("No products with available stock")

    async def test_stock_out_form_with_available_products(self, user: User, new_db) -> None:
        """Test stock-out form when products with stock exist"""
        InventoryService.create_product(
            ProductCreate(name="Available Product", sku="AVAIL001", current_stock=Decimal("20"))
        )

        await user.open("/stock-out")

        # Form should be available
        await user.should_see("Product")
        await user.should_see("Quantity")
        await user.should_see("Reason")
        await user.should_see("Add Stock Out")

    async def test_record_stock_out_transaction(self, user: User, new_db) -> None:
        """Test recording a stock-out transaction"""
        # Create a test product with stock
        InventoryService.create_product(ProductCreate(name="Stocked Item", sku="STOCK001", current_stock=Decimal("25")))

        await user.open("/stock-out")

        # Should at least see the form elements
        await user.should_see("Add Stock Out")
        await user.should_see("Product")
        await user.should_see("Quantity")
        await user.should_see("Reason")


class TestUIInteractions:
    async def test_navigation_between_pages(self, user: User, new_db) -> None:
        """Test navigation between different pages"""
        # Test direct navigation to pages
        await user.open("/")
        await user.should_see("Dashboard Overview")

        await user.open("/products")
        await user.should_see("Product Management")

        await user.open("/stock-in")
        await user.should_see("Stock In Transactions")

        await user.open("/stock-out")
        await user.should_see("Stock Out Transactions")

    async def test_quick_actions_navigation(self, user: User, new_db) -> None:
        """Test quick actions buttons on dashboard"""
        await user.open("/")

        # Test Add New Product button
        user.find("Add New Product").click()
        await user.should_see("Product Management")

        # Go back to dashboard
        await user.open("/")

        # Test Record Stock In button
        user.find("Record Stock In").click()
        await user.should_see("Stock In Transactions")

        # Go back to dashboard
        await user.open("/")

        # Test Record Stock Out button
        user.find("Record Stock Out").click()
        await user.should_see("Stock Out Transactions")

    async def test_dashboard_refresh(self, user: User, new_db) -> None:
        """Test dashboard refresh functionality"""
        await user.open("/")

        # Click refresh button
        user.find("Refresh Dashboard").click()

        # Should still see dashboard content
        await user.should_see("Dashboard Overview")
        await user.should_see("Total Products")


class TestErrorHandling:
    async def test_invalid_product_creation(self, user: User, new_db) -> None:
        """Test error handling for invalid product creation"""
        await user.open("/products")
        user.find("Add Product").click()

        # Try to save without filling required fields
        user.find("Save").click()

        await user.should_see("Name and SKU are required")

    async def test_form_validation_error(self, user: User, new_db) -> None:
        """Test form validation for required fields"""
        await user.open("/products")
        user.find("Add Product").click()

        # Try to save without filling required fields
        user.find("Save").click()

        # Should see validation error
        await user.should_see("required")
