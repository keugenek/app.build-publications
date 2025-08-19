from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional, List
from enum import Enum


class JenisTransaksi(str, Enum):
    """Jenis transaksi: masuk atau keluar"""

    MASUK = "masuk"
    KELUAR = "keluar"


# Persistent models (stored in database)
class Barang(SQLModel, table=True):
    """Model untuk data barang dalam inventaris"""

    __tablename__ = "barang"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    nama: str = Field(max_length=200, description="Nama barang")
    kode: str = Field(max_length=50, unique=True, description="Kode unik barang")
    deskripsi: str = Field(default="", max_length=1000, description="Deskripsi barang")
    kuantitas_stok: int = Field(default=0, ge=0, description="Kuantitas stok saat ini")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship dengan transaksi
    transaksi: List["Transaksi"] = Relationship(back_populates="barang")


class Transaksi(SQLModel, table=True):
    """Model untuk transaksi barang masuk dan keluar"""

    __tablename__ = "transaksi"  # type: ignore[assignment]

    id: Optional[int] = Field(default=None, primary_key=True)
    tanggal: datetime = Field(default_factory=datetime.utcnow, description="Tanggal transaksi")
    jenis_transaksi: JenisTransaksi = Field(description="Jenis transaksi: masuk atau keluar")
    kuantitas: int = Field(gt=0, description="Kuantitas transaksi (harus positif)")
    keterangan: str = Field(default="", max_length=500, description="Keterangan tambahan")
    barang_id: int = Field(foreign_key="barang.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship dengan barang
    barang: Barang = Relationship(back_populates="transaksi")


# Non-persistent schemas (for validation, forms, API requests/responses)
class BarangCreate(SQLModel, table=False):
    """Schema untuk membuat barang baru"""

    nama: str = Field(max_length=200, description="Nama barang")
    kode: str = Field(max_length=50, description="Kode unik barang")
    deskripsi: str = Field(default="", max_length=1000, description="Deskripsi barang")
    kuantitas_stok: int = Field(default=0, ge=0, description="Kuantitas stok awal")


class BarangUpdate(SQLModel, table=False):
    """Schema untuk mengupdate barang"""

    nama: Optional[str] = Field(default=None, max_length=200, description="Nama barang")
    kode: Optional[str] = Field(default=None, max_length=50, description="Kode unik barang")
    deskripsi: Optional[str] = Field(default=None, max_length=1000, description="Deskripsi barang")
    kuantitas_stok: Optional[int] = Field(default=None, ge=0, description="Kuantitas stok")


class TransaksiCreate(SQLModel, table=False):
    """Schema untuk membuat transaksi baru"""

    jenis_transaksi: JenisTransaksi = Field(description="Jenis transaksi: masuk atau keluar")
    kuantitas: int = Field(gt=0, description="Kuantitas transaksi (harus positif)")
    keterangan: str = Field(default="", max_length=500, description="Keterangan tambahan")
    barang_id: int = Field(description="ID barang yang ditransaksikan")
    tanggal: Optional[datetime] = Field(default=None, description="Tanggal transaksi (opsional, default saat ini)")


class TransaksiUpdate(SQLModel, table=False):
    """Schema untuk mengupdate transaksi"""

    jenis_transaksi: Optional[JenisTransaksi] = Field(default=None, description="Jenis transaksi: masuk atau keluar")
    kuantitas: Optional[int] = Field(default=None, gt=0, description="Kuantitas transaksi (harus positif)")
    keterangan: Optional[str] = Field(default=None, max_length=500, description="Keterangan tambahan")
    tanggal: Optional[datetime] = Field(default=None, description="Tanggal transaksi")


class BarangResponse(SQLModel, table=False):
    """Schema untuk response barang dengan informasi lengkap"""

    id: int
    nama: str
    kode: str
    deskripsi: str
    kuantitas_stok: int
    created_at: datetime
    updated_at: datetime


class TransaksiResponse(SQLModel, table=False):
    """Schema untuk response transaksi dengan informasi barang"""

    id: int
    tanggal: datetime
    jenis_transaksi: JenisTransaksi
    kuantitas: int
    keterangan: str
    barang_id: int
    created_at: datetime
    barang: Optional[BarangResponse] = None
