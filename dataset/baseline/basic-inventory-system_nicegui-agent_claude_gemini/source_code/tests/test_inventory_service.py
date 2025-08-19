import pytest
from decimal import Decimal
from app.database import reset_db
from app.inventory_service import InventoryService
from app.models import ProductCreate, ProductUpdate, StockInTransactionCreate, StockOutTransactionCreate


@pytest.fixture()
def new_db():
    reset_db()
    yield
    reset_db()


class TestProductManagement:
    def test_create_product_success(self, new_db):
        """Test creating a new product"""
        product_data = ProductCreate(name="Test Product", sku="TEST001", current_stock=Decimal("100"))

        product = InventoryService.create_product(product_data)

        assert product.id is not None
        assert product.name == "Test Product"
        assert product.sku == "TEST001"
        assert product.current_stock == Decimal("100")
        assert product.created_at is not None
        assert product.updated_at is not None

    def test_create_product_default_stock(self, new_db):
        """Test creating product with default stock of 0"""
        product_data = ProductCreate(name="Zero Stock Product", sku="ZERO001")

        product = InventoryService.create_product(product_data)
        assert product.current_stock == Decimal("0")

    def test_create_product_duplicate_sku_fails(self, new_db):
        """Test that creating product with duplicate SKU fails"""
        product_data = ProductCreate(name="First Product", sku="DUPLICATE")
        InventoryService.create_product(product_data)

        duplicate_data = ProductCreate(name="Second Product", sku="DUPLICATE")

        with pytest.raises(ValueError, match="Product with SKU 'DUPLICATE' already exists"):
            InventoryService.create_product(duplicate_data)

    def test_get_all_products_ordered_by_name(self, new_db):
        """Test getting all products ordered by name"""
        # Create products in reverse alphabetical order
        InventoryService.create_product(ProductCreate(name="Zebra Product", sku="ZEBRA"))
        InventoryService.create_product(ProductCreate(name="Alpha Product", sku="ALPHA"))
        InventoryService.create_product(ProductCreate(name="Beta Product", sku="BETA"))

        products = InventoryService.get_all_products()

        assert len(products) == 3
        assert products[0].name == "Alpha Product"
        assert products[1].name == "Beta Product"
        assert products[2].name == "Zebra Product"

    def test_get_product_by_id_exists(self, new_db):
        """Test getting product by ID when it exists"""
        created_product = InventoryService.create_product(ProductCreate(name="Test Product", sku="TEST001"))

        if created_product.id is None:
            pytest.fail("Created product ID should not be None")

        retrieved_product = InventoryService.get_product_by_id(created_product.id)

        assert retrieved_product is not None
        assert retrieved_product.id == created_product.id
        assert retrieved_product.name == "Test Product"

    def test_get_product_by_id_not_exists(self, new_db):
        """Test getting product by ID when it doesn't exist"""
        result = InventoryService.get_product_by_id(999)
        assert result is None

    def test_get_product_by_sku_exists(self, new_db):
        """Test getting product by SKU when it exists"""
        InventoryService.create_product(ProductCreate(name="Test Product", sku="UNIQUE001"))

        product = InventoryService.get_product_by_sku("UNIQUE001")

        assert product is not None
        assert product.sku == "UNIQUE001"
        assert product.name == "Test Product"

    def test_get_product_by_sku_not_exists(self, new_db):
        """Test getting product by SKU when it doesn't exist"""
        result = InventoryService.get_product_by_sku("NONEXISTENT")
        assert result is None

    def test_update_product_success(self, new_db):
        """Test updating an existing product"""
        product = InventoryService.create_product(
            ProductCreate(name="Original Name", sku="ORIG001", current_stock=Decimal("50"))
        )

        if product.id is None:
            pytest.fail("Product ID should not be None")

        update_data = ProductUpdate(name="Updated Name", sku="UPDATED001", current_stock=Decimal("75"))

        updated_product = InventoryService.update_product(product.id, update_data)

        assert updated_product is not None
        assert updated_product.name == "Updated Name"
        assert updated_product.sku == "UPDATED001"
        assert updated_product.current_stock == Decimal("75")
        assert updated_product.updated_at > updated_product.created_at

    def test_update_product_partial(self, new_db):
        """Test partial update of product"""
        product = InventoryService.create_product(
            ProductCreate(name="Original", sku="ORIG001", current_stock=Decimal("50"))
        )

        if product.id is None:
            pytest.fail("Product ID should not be None")

        # Only update name
        update_data = ProductUpdate(name="New Name Only")
        updated_product = InventoryService.update_product(product.id, update_data)

        assert updated_product is not None
        assert updated_product.name == "New Name Only"
        assert updated_product.sku == "ORIG001"  # Unchanged
        assert updated_product.current_stock == Decimal("50")  # Unchanged

    def test_update_product_duplicate_sku_fails(self, new_db):
        """Test that updating to duplicate SKU fails"""
        InventoryService.create_product(ProductCreate(name="Product 1", sku="SKU001"))
        product2 = InventoryService.create_product(ProductCreate(name="Product 2", sku="SKU002"))

        if product2.id is None:
            pytest.fail("Product ID should not be None")

        update_data = ProductUpdate(sku="SKU001")  # Try to use existing SKU

        with pytest.raises(ValueError, match="Product with SKU 'SKU001' already exists"):
            InventoryService.update_product(product2.id, update_data)

    def test_update_product_not_exists(self, new_db):
        """Test updating non-existent product"""
        update_data = ProductUpdate(name="New Name")
        result = InventoryService.update_product(999, update_data)

        assert result is None

    def test_delete_product_success(self, new_db):
        """Test deleting a product"""
        product = InventoryService.create_product(ProductCreate(name="To Delete", sku="DELETE001"))

        if product.id is None:
            pytest.fail("Product ID should not be None")

        success = InventoryService.delete_product(product.id)
        assert success

        # Verify product is deleted
        deleted_product = InventoryService.get_product_by_id(product.id)
        assert deleted_product is None

    def test_delete_product_not_exists(self, new_db):
        """Test deleting non-existent product"""
        result = InventoryService.delete_product(999)
        assert not result


class TestStockInTransactions:
    def test_record_stock_in_success(self, new_db):
        """Test recording a stock-in transaction"""
        product = InventoryService.create_product(
            ProductCreate(name="Test Product", sku="TEST001", current_stock=Decimal("10"))
        )

        if product.id is None:
            pytest.fail("Product ID should not be None")

        transaction_data = StockInTransactionCreate(
            product_id=product.id,
            quantity=Decimal("20"),
            unit_cost=Decimal("5.50"),
            supplier="Test Supplier",
            reference_number="PO-001",
            notes="Test stock in",
        )

        transaction = InventoryService.record_stock_in(transaction_data)

        assert transaction.id is not None
        assert transaction.product_id == product.id
        assert transaction.quantity == Decimal("20")
        assert transaction.unit_cost == Decimal("5.50")
        assert transaction.supplier == "Test Supplier"
        assert transaction.reference_number == "PO-001"
        assert transaction.notes == "Test stock in"

        # Verify product stock updated
        updated_product = InventoryService.get_product_by_id(product.id)
        assert updated_product is not None
        assert updated_product.current_stock == Decimal("30")  # 10 + 20

    def test_record_stock_in_minimal_data(self, new_db):
        """Test recording stock-in with minimal required data"""
        product = InventoryService.create_product(ProductCreate(name="Test Product", sku="TEST001"))

        if product.id is None:
            pytest.fail("Product ID should not be None")

        transaction_data = StockInTransactionCreate(product_id=product.id, quantity=Decimal("15"))

        transaction = InventoryService.record_stock_in(transaction_data)

        assert transaction.quantity == Decimal("15")
        assert transaction.unit_cost is None
        assert transaction.supplier is None
        assert transaction.reference_number is None
        assert transaction.notes is None

        # Verify product stock updated
        updated_product = InventoryService.get_product_by_id(product.id)
        assert updated_product is not None
        assert updated_product.current_stock == Decimal("15")

    def test_record_stock_in_product_not_exists(self, new_db):
        """Test recording stock-in for non-existent product"""
        transaction_data = StockInTransactionCreate(product_id=999, quantity=Decimal("10"))

        with pytest.raises(ValueError, match="Product with ID 999 not found"):
            InventoryService.record_stock_in(transaction_data)

    def test_get_stock_in_transactions_all(self, new_db):
        """Test getting all stock-in transactions"""
        product1 = InventoryService.create_product(ProductCreate(name="Product 1", sku="P001"))
        product2 = InventoryService.create_product(ProductCreate(name="Product 2", sku="P002"))

        if product1.id is None or product2.id is None:
            pytest.fail("Product IDs should not be None")

        # Create transactions
        InventoryService.record_stock_in(StockInTransactionCreate(product_id=product1.id, quantity=Decimal("10")))
        InventoryService.record_stock_in(StockInTransactionCreate(product_id=product2.id, quantity=Decimal("20")))
        InventoryService.record_stock_in(StockInTransactionCreate(product_id=product1.id, quantity=Decimal("5")))

        transactions = InventoryService.get_stock_in_transactions()

        assert len(transactions) == 3
        # Should be ordered by date descending (most recent first)
        assert transactions[0].quantity == Decimal("5")  # Last created

    def test_get_stock_in_transactions_filtered_by_product(self, new_db):
        """Test getting stock-in transactions filtered by product"""
        product1 = InventoryService.create_product(ProductCreate(name="Product 1", sku="P001"))
        product2 = InventoryService.create_product(ProductCreate(name="Product 2", sku="P002"))

        if product1.id is None or product2.id is None:
            pytest.fail("Product IDs should not be None")

        InventoryService.record_stock_in(StockInTransactionCreate(product_id=product1.id, quantity=Decimal("10")))
        InventoryService.record_stock_in(StockInTransactionCreate(product_id=product2.id, quantity=Decimal("20")))
        InventoryService.record_stock_in(StockInTransactionCreate(product_id=product1.id, quantity=Decimal("5")))

        product1_transactions = InventoryService.get_stock_in_transactions(product_id=product1.id)

        assert len(product1_transactions) == 2
        for transaction in product1_transactions:
            assert transaction.product_id == product1.id


class TestStockOutTransactions:
    def test_record_stock_out_success(self, new_db):
        """Test recording a stock-out transaction"""
        product = InventoryService.create_product(
            ProductCreate(name="Test Product", sku="TEST001", current_stock=Decimal("50"))
        )

        if product.id is None:
            pytest.fail("Product ID should not be None")

        transaction_data = StockOutTransactionCreate(
            product_id=product.id,
            quantity=Decimal("15"),
            reason="Sale",
            reference_number="INV-001",
            notes="Customer purchase",
        )

        transaction = InventoryService.record_stock_out(transaction_data)

        assert transaction.id is not None
        assert transaction.product_id == product.id
        assert transaction.quantity == Decimal("15")
        assert transaction.reason == "Sale"
        assert transaction.reference_number == "INV-001"
        assert transaction.notes == "Customer purchase"

        # Verify product stock updated
        updated_product = InventoryService.get_product_by_id(product.id)
        assert updated_product is not None
        assert updated_product.current_stock == Decimal("35")  # 50 - 15

    def test_record_stock_out_insufficient_stock_fails(self, new_db):
        """Test that stock-out fails when insufficient stock"""
        product = InventoryService.create_product(
            ProductCreate(name="Test Product", sku="TEST001", current_stock=Decimal("10"))
        )

        if product.id is None:
            pytest.fail("Product ID should not be None")

        transaction_data = StockOutTransactionCreate(
            product_id=product.id,
            quantity=Decimal("15"),  # More than available
        )

        with pytest.raises(ValueError, match="Insufficient stock. Available: 10, Requested: 15"):
            InventoryService.record_stock_out(transaction_data)

        # Verify stock unchanged
        product_after = InventoryService.get_product_by_id(product.id)
        assert product_after is not None
        assert product_after.current_stock == Decimal("10")

    def test_record_stock_out_exact_stock(self, new_db):
        """Test recording stock-out with exact available stock"""
        product = InventoryService.create_product(
            ProductCreate(name="Test Product", sku="TEST001", current_stock=Decimal("10"))
        )

        if product.id is None:
            pytest.fail("Product ID should not be None")

        transaction_data = StockOutTransactionCreate(product_id=product.id, quantity=Decimal("10"))

        transaction = InventoryService.record_stock_out(transaction_data)
        assert transaction.quantity == Decimal("10")

        # Verify stock is zero
        updated_product = InventoryService.get_product_by_id(product.id)
        assert updated_product is not None
        assert updated_product.current_stock == Decimal("0")

    def test_record_stock_out_product_not_exists(self, new_db):
        """Test recording stock-out for non-existent product"""
        transaction_data = StockOutTransactionCreate(product_id=999, quantity=Decimal("10"))

        with pytest.raises(ValueError, match="Product with ID 999 not found"):
            InventoryService.record_stock_out(transaction_data)

    def test_get_stock_out_transactions_filtered_by_product(self, new_db):
        """Test getting stock-out transactions filtered by product"""
        product1 = InventoryService.create_product(
            ProductCreate(name="Product 1", sku="P001", current_stock=Decimal("100"))
        )
        product2 = InventoryService.create_product(
            ProductCreate(name="Product 2", sku="P002", current_stock=Decimal("100"))
        )

        if product1.id is None or product2.id is None:
            pytest.fail("Product IDs should not be None")

        InventoryService.record_stock_out(StockOutTransactionCreate(product_id=product1.id, quantity=Decimal("10")))
        InventoryService.record_stock_out(StockOutTransactionCreate(product_id=product2.id, quantity=Decimal("20")))
        InventoryService.record_stock_out(StockOutTransactionCreate(product_id=product1.id, quantity=Decimal("5")))

        product1_transactions = InventoryService.get_stock_out_transactions(product_id=product1.id)

        assert len(product1_transactions) == 2
        for transaction in product1_transactions:
            assert transaction.product_id == product1.id


class TestInventorySummary:
    def test_inventory_summary_empty_database(self, new_db):
        """Test inventory summary with no products"""
        summary = InventoryService.get_inventory_summary()

        assert summary["total_products"] == 0
        assert summary["total_stock_units"] == Decimal("0")
        assert summary["low_stock_count"] == 0
        assert summary["out_of_stock_count"] == 0
        assert len(summary["low_stock_products"]) == 0
        assert len(summary["out_of_stock_products"]) == 0

    def test_inventory_summary_with_mixed_stock_levels(self, new_db):
        """Test inventory summary with various stock levels"""
        # Create products with different stock levels
        InventoryService.create_product(ProductCreate(name="High Stock", sku="HIGH001", current_stock=Decimal("100")))
        InventoryService.create_product(ProductCreate(name="Low Stock", sku="LOW001", current_stock=Decimal("5")))
        InventoryService.create_product(ProductCreate(name="Out of Stock", sku="OUT001", current_stock=Decimal("0")))
        InventoryService.create_product(ProductCreate(name="Medium Stock", sku="MED001", current_stock=Decimal("25")))

        summary = InventoryService.get_inventory_summary()

        assert summary["total_products"] == 4
        assert summary["total_stock_units"] == Decimal("130")  # 100 + 5 + 0 + 25
        assert summary["low_stock_count"] == 2  # Stock = 5 and stock = 0 (both < 10)
        assert summary["out_of_stock_count"] == 1  # Only the one with stock = 0

        # Check that correct products are in alert lists
        low_stock_skus = [p.sku for p in summary["low_stock_products"]]
        out_of_stock_skus = [p.sku for p in summary["out_of_stock_products"]]

        assert "LOW001" in low_stock_skus
        assert "OUT001" in out_of_stock_skus
        assert "HIGH001" not in low_stock_skus and "HIGH001" not in out_of_stock_skus
        assert "MED001" not in low_stock_skus and "MED001" not in out_of_stock_skus


class TestProductDeletionWithTransactions:
    def test_delete_product_with_transactions(self, new_db):
        """Test that deleting a product also deletes its transactions"""
        product = InventoryService.create_product(
            ProductCreate(name="Test Product", sku="TEST001", current_stock=Decimal("50"))
        )

        if product.id is None:
            pytest.fail("Product ID should not be None")

        # Add some transactions
        InventoryService.record_stock_in(StockInTransactionCreate(product_id=product.id, quantity=Decimal("20")))
        InventoryService.record_stock_out(StockOutTransactionCreate(product_id=product.id, quantity=Decimal("10")))

        # Verify transactions exist
        stock_in_transactions = InventoryService.get_stock_in_transactions(product_id=product.id)
        stock_out_transactions = InventoryService.get_stock_out_transactions(product_id=product.id)
        assert len(stock_in_transactions) == 1
        assert len(stock_out_transactions) == 1

        # Delete product
        success = InventoryService.delete_product(product.id)
        assert success

        # Verify transactions are also deleted
        stock_in_transactions = InventoryService.get_stock_in_transactions(product_id=product.id)
        stock_out_transactions = InventoryService.get_stock_out_transactions(product_id=product.id)
        assert len(stock_in_transactions) == 0
        assert len(stock_out_transactions) == 0
