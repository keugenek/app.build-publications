import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Calendar, Package, FileText } from 'lucide-react';
import type { Transaksi } from '../../../server/src/schema';

interface TransaksiListProps {
  transaksis: Transaksi[];
  isLoading?: boolean;
}

export function TransaksiList({ transaksis, isLoading = false }: TransaksiListProps) {
  const getTransactionIcon = (jenis: string) => {
    return jenis === 'masuk' ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getTransactionBadgeVariant = (jenis: string) => {
    return jenis === 'masuk' ? 'default' : 'destructive';
  };

  const getTransactionBadgeText = (jenis: string) => {
    return jenis === 'masuk' ? '📈 Masuk' : '📉 Keluar';
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupTransactionsByDate = (transactions: Transaksi[]) => {
    const grouped: { [key: string]: Transaksi[] } = {};
    
    transactions.forEach((transaksi: Transaksi) => {
      const dateKey = new Date(transaksi.tanggal_transaksi).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaksi);
    });

    // Sort dates in descending order (newest first)
    const sortedDates = Object.keys(grouped).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    return sortedDates.map(dateKey => ({
      date: new Date(dateKey),
      transactions: grouped[dateKey].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          Memuat data transaksi...
        </div>
      </div>
    );
  }

  if (transaksis.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada transaksi</h3>
        <p className="text-gray-500 mb-4">
          Transaksi barang masuk dan keluar akan tampil di sini.
        </p>
        <p className="text-sm text-green-600">
          💡 Tip: Mulai dengan mencatat transaksi barang masuk untuk menambah stok inventaris.
        </p>
      </div>
    );
  }

  const groupedTransactions = groupTransactionsByDate(transaksis);

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Transaksi</p>
                <p className="text-2xl font-bold text-blue-900">{transaksis.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Barang Masuk</p>
                <p className="text-2xl font-bold text-green-900">
                  {transaksis.filter((t: Transaksi) => t.jenis === 'masuk').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Barang Keluar</p>
                <p className="text-2xl font-bold text-red-900">
                  {transaksis.filter((t: Transaksi) => t.jenis === 'keluar').length}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions by Date */}
      {groupedTransactions.map(({ date, transactions }) => (
        <div key={date.toDateString()} className="space-y-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
            <Calendar className="h-4 w-4 text-gray-600" />
            <h3 className="font-semibold text-gray-800">
              {formatDate(date)}
            </h3>
            <Badge variant="outline" className="ml-auto">
              {transactions.length} transaksi
            </Badge>
          </div>

          <div className="space-y-3">
            {transactions.map((transaksi: Transaksi) => (
              <Card key={transaksi.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-3">
                        {getTransactionIcon(transaksi.jenis)}
                        <span className="flex items-center gap-2">
                          {transaksi.nama_barang}
                          <Badge variant={getTransactionBadgeVariant(transaksi.jenis)}>
                            {getTransactionBadgeText(transaksi.jenis)}
                          </Badge>
                        </span>
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        ID Barang: #{transaksi.barang_id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Waktu</p>
                      <p className="text-sm font-medium">
                        {formatTime(transaksi.tanggal_transaksi)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Jumlah</p>
                      <p className={`text-xl font-bold ${
                        transaksi.jenis === 'masuk' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaksi.jenis === 'masuk' ? '+' : '-'}
                        {transaksi.jumlah.toLocaleString('id-ID')} unit
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Dicatat pada</p>
                      <p className="text-sm text-gray-600">
                        {new Date(transaksi.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
