import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowLeft, ShoppingCart, User, Calendar, DollarSign,
    Package, Check, XCircle, Clock, Printer, Download,
    Receipt, CreditCard, MapPin, Phone, Mail
} from 'lucide-react'
import { saleApi, productApi, userApi } from '../../api'
import { Button, Card, Badge, Loading, Avatar } from '../../components/ui'
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters'
import { getOptimizedImageUrl } from '../../utils/cloudinary'
import toast from 'react-hot-toast'

export default function SaleDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [sale, setSale] = useState(null)
    const [vendor, setVendor] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [id])

    const fetchData = async () => {
        try {
            setLoading(true)
            const saleRes = await saleApi.getById(id)
            setSale(saleRes.data)

            // Fetch vendor info if userId exists
            if (saleRes.data?.userId) {
                try {
                    const vendorRes = await userApi.getById(saleRes.data.userId)
                    setVendor(vendorRes.data)
                } catch (e) {
                    // Vendor not found, continue without
                }
            }
        } catch (error) {
            toast.error('Erreur lors du chargement')
            navigate('/admin/sales')
        } finally {
            setLoading(false)
        }
    }

    const handleCancel = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir annuler cette vente ?')) return

        try {
            await saleApi.cancel(id)
            toast.success('Vente annulée - Stock restauré')
            fetchData()
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation')
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const getStatusBadge = (status) => {
        switch (status) {
            case 'COMPLETED':
            case 'CONFIRMED':
                return <Badge variant="success" className="text-sm"><Check className="w-4 h-4 mr-1" />Confirmée</Badge>
            case 'CANCELLED':
                return <Badge variant="danger" className="text-sm"><XCircle className="w-4 h-4 mr-1" />Annulée</Badge>
            case 'PENDING':
            default:
                return <Badge variant="warning" className="text-sm"><Clock className="w-4 h-4 mr-1" />En attente</Badge>
        }
    }

    if (loading) return <Loading />

    if (!sale) {
        return (
            <div className="text-center py-12">
                <p className="text-dark-500">Vente non trouvée</p>
                <Button onClick={() => navigate('/admin/sales')} className="mt-4">
                    Retour aux ventes
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 print:space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin/sales')}
                        className="p-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-3">
                            <ShoppingCart className="w-7 h-7 text-primary-500" />
                            Vente #{sale.id}
                        </h1>
                        <p className="text-dark-500">{formatDateTime(sale.saleDate)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimer
                    </Button>
                    {sale.status !== 'CANCELLED' && (
                        <Button variant="danger" onClick={handleCancel}>
                            <XCircle className="w-4 h-4 mr-2" />
                            Annuler
                        </Button>
                    )}
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center mb-8">
                <h1 className="text-3xl font-bold">FACTURE</h1>
                <p className="text-lg">Vente #{sale.id}</p>
                <p>{formatDateTime(sale.saleDate)}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Status Card */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-dark-900 dark:text-white">
                                Statut de la vente
                            </h3>
                            {getStatusBadge(sale.status)}
                        </div>

                        {/* Timeline */}
                        <div className="relative pl-8 space-y-4">
                            <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-dark-700"></div>

                            <div className="relative">
                                <div className="absolute -left-5 w-4 h-4 rounded-full bg-success-500 border-2 border-white dark:border-dark-800"></div>
                                <div>
                                    <p className="font-medium text-dark-900 dark:text-white">Vente créée</p>
                                    <p className="text-sm text-dark-500">{formatDateTime(sale.saleDate)}</p>
                                </div>
                            </div>

                            {sale.status === 'CONFIRMED' && (
                                <div className="relative">
                                    <div className="absolute -left-5 w-4 h-4 rounded-full bg-success-500 border-2 border-white dark:border-dark-800"></div>
                                    <div>
                                        <p className="font-medium text-dark-900 dark:text-white">Vente confirmée</p>
                                        <p className="text-sm text-dark-500">Stock déduit automatiquement</p>
                                    </div>
                                </div>
                            )}

                            {sale.status === 'CANCELLED' && (
                                <div className="relative">
                                    <div className="absolute -left-5 w-4 h-4 rounded-full bg-danger-500 border-2 border-white dark:border-dark-800"></div>
                                    <div>
                                        <p className="font-medium text-danger-600">Vente annulée</p>
                                        <p className="text-sm text-dark-500">Stock restauré</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Products */}
                    <Card className="p-6">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary-500" />
                            Articles ({sale.lignes?.length || 0})
                        </h3>

                        <div className="divide-y divide-gray-200 dark:divide-dark-700">
                            {sale.lignes?.map((ligne, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="py-4 first:pt-0 last:pb-0"
                                >
                                    <div className="flex items-center gap-4">
                                        {ligne.productImageUrl ? (
                                            <img
                                                src={getOptimizedImageUrl(ligne.productImageUrl, 80)}
                                                alt={ligne.productTitle}
                                                className="w-16 h-16 rounded-xl object-cover print:w-12 print:h-12"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center print:w-12 print:h-12">
                                                <Package className="w-8 h-8 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-dark-900 dark:text-white">
                                                {ligne.productTitle || `Produit #${ligne.productId}`}
                                            </p>
                                            <p className="text-sm text-dark-500">
                                                {formatCurrency(ligne.price)} × {ligne.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg text-primary-600">
                                                {formatCurrency(ligne.price * ligne.quantity)}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-700">
                            <div className="flex justify-between items-center">
                                <span className="text-dark-500">Sous-total</span>
                                <span className="font-medium">{formatCurrency(sale.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-dark-500">TVA (20%)</span>
                                <span className="font-medium">{formatCurrency(sale.totalAmount * 0.2)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
                                <span className="text-xl font-bold text-dark-900 dark:text-white">Total TTC</span>
                                <span className="text-2xl font-bold text-success-600">
                                    {formatCurrency(sale.totalAmount * 1.2)}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Summary */}
                    <Card className="p-6 bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <Receipt className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-white/70 text-sm">Montant total</p>
                                <p className="text-3xl font-bold">{formatCurrency(sale.totalAmount)}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                            <div>
                                <p className="text-white/70 text-xs">Articles</p>
                                <p className="font-bold text-lg">
                                    {sale.lignes?.reduce((sum, l) => sum + l.quantity, 0) || 0}
                                </p>
                            </div>
                            <div>
                                <p className="text-white/70 text-xs">Produits</p>
                                <p className="font-bold text-lg">{sale.lignes?.length || 0}</p>
                            </div>
                        </div>
                    </Card>

                    {/* Vendor Info */}
                    <Card className="p-6">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-primary-500" />
                            Vendeur
                        </h3>

                        <div className="flex items-center gap-3">
                            <Avatar name={sale.username || vendor?.username || 'V'} size="lg" />
                            <div>
                                <p className="font-medium text-dark-900 dark:text-white">
                                    {sale.username || vendor?.username || 'Inconnu'}
                                </p>
                                {vendor?.email && (
                                    <p className="text-sm text-dark-500 flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        {vendor.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        {vendor && (
                            <Button
                                variant="outline"
                                className="w-full mt-4"
                                onClick={() => navigate(`/admin/users/${vendor.id}`)}
                            >
                                Voir le profil
                            </Button>
                        )}
                    </Card>

                    {/* Actions */}
                    <Card className="p-6 print:hidden">
                        <h3 className="font-semibold text-dark-900 dark:text-white mb-4">
                            Actions rapides
                        </h3>
                        <div className="space-y-2">
                            <Button variant="outline" className="w-full" onClick={handlePrint}>
                                <Printer className="w-4 h-4 mr-2" />
                                Imprimer la facture
                            </Button>
                            <Button variant="outline" className="w-full">
                                <Download className="w-4 h-4 mr-2" />
                                Télécharger PDF
                            </Button>
                            {sale.status !== 'CANCELLED' && (
                                <Button variant="danger" className="w-full" onClick={handleCancel}>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Annuler la vente
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
