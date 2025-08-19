from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from sqlmodel import select, desc
from app.database import get_session
from app.models import (
    Product,
    StockInTransaction,
    StockOutTransaction,
    ProductCreate,
    ProductUpdate,
    StockInTransactionCreate,
    StockOutTransactionCreate,
)


class InventoryService:
    @staticmethod
    def get_all_products() -> List[Product]:
        """Get all products ordered by name"""
        with get_session() as session:
            statement = select(Product).order_by(Product.name)
            return list(session.exec(statement))

    @staticmethod
    def get_product_by_id(product_id: int) -> Optional[Product]:
        """Get product by ID"""
        with get_session() as session:
            return session.get(Product, product_id)

    @staticmethod
    def get_product_by_sku(sku: str) -> Optional[Product]:
        """Get product by SKU"""
        with get_session() as session:
            statement = select(Product).where(Product.sku == sku)
            return session.exec(statement).first()

    @staticmethod
    def create_product(product_data: ProductCreate) -> Product:
        """Create a new product"""
        with get_session() as session:
            # Check if SKU already exists
            existing = InventoryService.get_product_by_sku(product_data.sku)
            if existing:
                raise ValueError(f"Product with SKU '{product_data.sku}' already exists")

            product = Product(
                name=product_data.name,
                sku=product_data.sku,
                current_stock=product_data.current_stock,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            session.add(product)
            session.commit()
            session.refresh(product)
            return product

    @staticmethod
    def update_product(product_id: int, product_data: ProductUpdate) -> Optional[Product]:
        """Update an existing product"""
        with get_session() as session:
            product = session.get(Product, product_id)
            if product is None:
                return None

            # Check SKU uniqueness if SKU is being updated
            if product_data.sku and product_data.sku != product.sku:
                existing = InventoryService.get_product_by_sku(product_data.sku)
                if existing:
                    raise ValueError(f"Product with SKU '{product_data.sku}' already exists")

            # Update fields
            if product_data.name is not None:
                product.name = product_data.name
            if product_data.sku is not None:
                product.sku = product_data.sku
            if product_data.current_stock is not None:
                product.current_stock = product_data.current_stock

            product.updated_at = datetime.utcnow()
            session.commit()
            session.refresh(product)
            return product

    @staticmethod
    def delete_product(product_id: int) -> bool:
        """Delete a product and its transactions"""
        with get_session() as session:
            product = session.get(Product, product_id)
            if product is None:
                return False

            # Delete related transactions first
            stock_in_stmt = select(StockInTransaction).where(StockInTransaction.product_id == product_id)
            stock_in_transactions = session.exec(stock_in_stmt).all()
            for transaction in stock_in_transactions:
                session.delete(transaction)

            stock_out_stmt = select(StockOutTransaction).where(StockOutTransaction.product_id == product_id)
            stock_out_transactions = session.exec(stock_out_stmt).all()
            for transaction in stock_out_transactions:
                session.delete(transaction)

            session.delete(product)
            session.commit()
            return True

    @staticmethod
    def get_stock_in_transactions(product_id: Optional[int] = None, limit: int = 100) -> List[StockInTransaction]:
        """Get stock-in transactions, optionally filtered by product"""
        with get_session() as session:
            statement = select(StockInTransaction)
            if product_id is not None:
                statement = statement.where(StockInTransaction.product_id == product_id)
            statement = statement.order_by(desc(StockInTransaction.transaction_date)).limit(limit)
            return list(session.exec(statement))

    @staticmethod
    def get_stock_out_transactions(product_id: Optional[int] = None, limit: int = 100) -> List[StockOutTransaction]:
        """Get stock-out transactions, optionally filtered by product"""
        with get_session() as session:
            statement = select(StockOutTransaction)
            if product_id is not None:
                statement = statement.where(StockOutTransaction.product_id == product_id)
            statement = statement.order_by(desc(StockOutTransaction.transaction_date)).limit(limit)
            return list(session.exec(statement))

    @staticmethod
    def record_stock_in(transaction_data: StockInTransactionCreate) -> StockInTransaction:
        """Record a stock-in transaction and update product stock"""
        with get_session() as session:
            # Verify product exists
            product = session.get(Product, transaction_data.product_id)
            if product is None:
                raise ValueError(f"Product with ID {transaction_data.product_id} not found")

            # Create transaction
            transaction = StockInTransaction(
                product_id=transaction_data.product_id,
                quantity=transaction_data.quantity,
                unit_cost=transaction_data.unit_cost,
                supplier=transaction_data.supplier,
                reference_number=transaction_data.reference_number,
                notes=transaction_data.notes,
                transaction_date=transaction_data.transaction_date or datetime.utcnow(),
                created_at=datetime.utcnow(),
            )

            # Update product stock
            product.current_stock += transaction_data.quantity
            product.updated_at = datetime.utcnow()

            session.add(transaction)
            session.commit()
            session.refresh(transaction)
            return transaction

    @staticmethod
    def record_stock_out(transaction_data: StockOutTransactionCreate) -> StockOutTransaction:
        """Record a stock-out transaction and update product stock"""
        with get_session() as session:
            # Verify product exists
            product = session.get(Product, transaction_data.product_id)
            if product is None:
                raise ValueError(f"Product with ID {transaction_data.product_id} not found")

            # Check sufficient stock
            if product.current_stock < transaction_data.quantity:
                raise ValueError(
                    f"Insufficient stock. Available: {product.current_stock}, Requested: {transaction_data.quantity}"
                )

            # Create transaction
            transaction = StockOutTransaction(
                product_id=transaction_data.product_id,
                quantity=transaction_data.quantity,
                reason=transaction_data.reason,
                reference_number=transaction_data.reference_number,
                notes=transaction_data.notes,
                transaction_date=transaction_data.transaction_date or datetime.utcnow(),
                created_at=datetime.utcnow(),
            )

            # Update product stock
            product.current_stock -= transaction_data.quantity
            product.updated_at = datetime.utcnow()

            session.add(transaction)
            session.commit()
            session.refresh(transaction)
            return transaction

    @staticmethod
    def get_inventory_summary() -> dict:
        """Get summary statistics for inventory"""
        with get_session() as session:
            products = session.exec(select(Product)).all()

            total_products = len(products)
            total_stock_value = sum(p.current_stock for p in products)
            low_stock_products = [p for p in products if p.current_stock < Decimal("10")]
            out_of_stock_products = [p for p in products if p.current_stock == Decimal("0")]

            # Recent transactions count
            recent_stock_in = len(
                session.exec(
                    select(StockInTransaction).where(
                        StockInTransaction.transaction_date >= datetime.utcnow().replace(day=1)
                    )
                ).all()
            )

            recent_stock_out = len(
                session.exec(
                    select(StockOutTransaction).where(
                        StockOutTransaction.transaction_date >= datetime.utcnow().replace(day=1)
                    )
                ).all()
            )

            return {
                "total_products": total_products,
                "total_stock_units": total_stock_value,
                "low_stock_count": len(low_stock_products),
                "out_of_stock_count": len(out_of_stock_products),
                "recent_stock_in": recent_stock_in,
                "recent_stock_out": recent_stock_out,
                "low_stock_products": low_stock_products,
                "out_of_stock_products": out_of_stock_products,
            }
