import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    FileText, Plus, Download, Eye, Trash2, Calendar,
    BarChart3, PieChart, LineChart, Clock
} from 'lucide-react'
import { Card, Button, Modal, Input, Loading, EmptyState, Badge, ConfirmDialog } from '../../components/ui'
import { formatDate, formatDateTime } from '../../utils/formatters'
import { jsPDF } from 'jspdf'
import toast from 'react-hot-toast'

export default function Reports() {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [selectedReport, setSelectedReport] = useState(null)
    const [generating, setGenerating] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        type: 'sales',
        dateFrom: '',
        dateTo: '',
        format: 'pdf'
    })

    const reportTypes = [
        { value: 'sales', label: 'Rapport de Ventes', icon: BarChart3 },
        { value: 'products', label: 'Rapport Produits', icon: PieChart },
        { value: 'trends', label: 'Analyse des Tendances', icon: LineChart },
        { value: 'performance', label: 'Performance Globale', icon: BarChart3 }
    ]

    useEffect(() => {
        // Load saved reports from localStorage
        const saved = localStorage.getItem('analyst_reports')
        if (saved) {
            setReports(JSON.parse(saved))
        }
        setLoading(false)
    }, [])

    const saveReports = (newReports) => {
        setReports(newReports)
        localStorage.setItem('analyst_reports', JSON.stringify(newReports))
    }

    const handleGenerateReport = async () => {
        if (!formData.name) {
            toast.error('Veuillez entrer un nom de rapport')
            return
        }

        setGenerating(true)

        try {
            // Simulate report generation
            await new Promise(resolve => setTimeout(resolve, 2000))

            const newReport = {
                id: Date.now(),
                name: formData.name,
                type: formData.type,
                dateFrom: formData.dateFrom,
                dateTo: formData.dateTo,
                format: formData.format,
                createdAt: new Date().toISOString(),
                status: 'completed',
                size: `${Math.floor(Math.random() * 500) + 100} KB`
            }

            saveReports([newReport, ...reports])
            setShowModal(false)
            setFormData({ name: '', type: 'sales', dateFrom: '', dateTo: '', format: 'pdf' })
            toast.success('Rapport généré avec succès')
        } catch (error) {
            toast.error('Erreur lors de la génération')
        } finally {
            setGenerating(false)
        }
    }

    const handleDownloadReport = (report) => {
        // Generate PDF
        const doc = new jsPDF()

        doc.setFontSize(20)
        doc.text(report.name, 20, 30)

        doc.setFontSize(12)
        doc.text(`Type: ${reportTypes.find(t => t.value === report.type)?.label}`, 20, 50)
        doc.text(`Généré le: ${formatDateTime(report.createdAt)}`, 20, 60)

        if (report.dateFrom && report.dateTo) {
            doc.text(`Période: ${formatDate(report.dateFrom)} - ${formatDate(report.dateTo)}`, 20, 70)
        }

        doc.setFontSize(14)
        doc.text('Résumé', 20, 90)

        doc.setFontSize(10)
        doc.text('Ce rapport contient une analyse détaillée basée sur les données disponibles.', 20, 100)
        doc.text('Les graphiques et tableaux de données sont inclus dans les pages suivantes.', 20, 110)

        doc.save(`${report.name.replace(/\s+/g, '_')}.pdf`)
        toast.success('Rapport téléchargé')
    }

    const handleDeleteReport = () => {
        if (!selectedReport) return

        const newReports = reports.filter(r => r.id !== selectedReport.id)
        saveReports(newReports)
        setShowDeleteConfirm(false)
        setSelectedReport(null)
        toast.success('Rapport supprimé')
    }

    if (loading) return <Loading />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Rapports</h1>
                    <p className="text-dark-500">Générez et gérez vos rapports d'analyse</p>
                </div>
                <Button onClick={() => setShowModal(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    Nouveau Rapport
                </Button>
            </div>

            {/* Report Type Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {reportTypes.map((type, index) => {
                    const count = reports.filter(r => r.type === type.value).length
                    return (
                        <motion.div
                            key={type.value}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                                setFormData(prev => ({ ...prev, type: type.value }))
                                setShowModal(true)
                            }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                        <type.icon className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-dark-900 dark:text-white">{type.label}</p>
                                        <p className="text-sm text-dark-500">{count} rapport(s)</p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>

            {/* Reports List */}
            {reports.length > 0 ? (
                <Card className="overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                        <h3 className="font-semibold text-dark-900 dark:text-white">Rapports Générés</h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-dark-700">
                        {reports.map((report, index) => {
                            const typeInfo = reportTypes.find(t => t.value === report.type)
                            return (
                                <motion.div
                                    key={report.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-4 hover:bg-dark-50 dark:hover:bg-dark-800/50"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-primary-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-dark-900 dark:text-white">{report.name}</h4>
                                                <div className="flex items-center gap-3 text-sm text-dark-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        {typeInfo && <typeInfo.icon className="w-4 h-4" />}
                                                        {typeInfo?.label}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {formatDateTime(report.createdAt)}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{report.size}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="success">Terminé</Badge>
                                            <button
                                                onClick={() => handleDownloadReport(report)}
                                                className="p-2 hover:bg-dark-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                                            >
                                                <Download className="w-5 h-5 text-dark-500" />
                                            </button>
                                            <button
                                                onClick={() => { setSelectedReport(report); setShowDeleteConfirm(true) }}
                                                className="p-2 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-5 h-5 text-danger-500" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </Card>
            ) : (
                <EmptyState
                    icon={FileText}
                    title="Aucun rapport"
                    description="Générez votre premier rapport d'analyse"
                    action={
                        <Button onClick={() => setShowModal(true)}>
                            <Plus className="w-5 h-5 mr-2" />
                            Créer un rapport
                        </Button>
                    }
                />
            )}

            {/* New Report Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Nouveau Rapport"
            >
                <div className="space-y-4">
                    <Input
                        label="Nom du rapport"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ex: Rapport mensuel des ventes"
                    />

                    <div>
                        <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                            Type de rapport
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {reportTypes.map((type) => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, type: type.value }))}
                                    className={`p-3 rounded-xl border-2 text-left transition-all ${formData.type === type.value
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                            : 'border-gray-200 dark:border-dark-700 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <type.icon className={`w-5 h-5 ${formData.type === type.value ? 'text-primary-600' : 'text-dark-400'
                                            }`} />
                                        <span className={`text-sm font-medium ${formData.type === type.value
                                                ? 'text-primary-700 dark:text-primary-300'
                                                : 'text-dark-700 dark:text-dark-300'
                                            }`}>
                                            {type.label}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                                Date début
                            </label>
                            <input
                                type="date"
                                value={formData.dateFrom}
                                onChange={(e) => setFormData(prev => ({ ...prev, dateFrom: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
                                Date fin
                            </label>
                            <input
                                type="date"
                                value={formData.dateTo}
                                onChange={(e) => setFormData(prev => ({ ...prev, dateTo: e.target.value }))}
                                className="w-full px-4 py-2.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-xl text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
                        <Button variant="ghost" onClick={() => setShowModal(false)}>
                            Annuler
                        </Button>
                        <Button onClick={handleGenerateReport} loading={generating}>
                            <FileText className="w-5 h-5 mr-2" />
                            Générer
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteReport}
                title="Supprimer le rapport"
                message={`Êtes-vous sûr de vouloir supprimer "${selectedReport?.name}" ?`}
                confirmText="Supprimer"
                variant="danger"
            />
        </div>
    )
}
