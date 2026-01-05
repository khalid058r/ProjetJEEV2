import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Upload, FileText, CheckCircle, XCircle, AlertTriangle,
    RefreshCw, Database, FileSpreadsheet, Download,
    Eye, Trash2, Play, Loader2, Clock, Info
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { etlApi } from '../../api'
import { Card, Button, Badge } from '../../components/ui'
import toast from 'react-hot-toast'

export default function ETLImport() {
    const [file, setFile] = useState(null)
    const [validationResult, setValidationResult] = useState(null)
    const [importing, setImporting] = useState(false)
    const [jobs, setJobs] = useState([])
    const [activeTab, setActiveTab] = useState('upload')
    const [previewData, setPreviewData] = useState(null)

    // Dropzone configuration
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            const selectedFile = acceptedFiles[0]
            setFile(selectedFile)
            setValidationResult(null)
            setPreviewData(null)
            validateFile(selectedFile)
        }
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.csv', '.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
        },
        maxFiles: 1,
        maxSize: 50 * 1024 * 1024 // 50MB
    })

    const validateFile = async (fileToValidate) => {
        try {
            const result = await etlApi.validateFile(fileToValidate)
            setValidationResult(result)

            // L'API Python retourne preview.sample_rows pour l'aperçu
            if (result.preview?.sample_rows) {
                setPreviewData(result.preview.sample_rows)
            } else if (result.preview) {
                setPreviewData(result.preview)
            }

            // Ajoute les colonnes et row_count au résultat de validation
            if (result.preview?.columns) {
                result.columns = result.preview.columns
            }
            if (result.preview?.row_count) {
                result.row_count = result.preview.row_count
            }

            if (result.valid) {
                toast.success('Fichier validé avec succès')
            } else {
                toast.error('Erreurs de validation détectées')
            }
        } catch (error) {
            console.error('Erreur validation:', error)
            toast.error('Erreur lors de la validation du fichier')
            setValidationResult({
                valid: false,
                errors: ['Impossible de valider le fichier. Vérifiez que le service Python est actif.']
            })
        }
    }

    const handleImport = async () => {
        if (!file) return

        setImporting(true)
        try {
            const result = await etlApi.processAndImport(file, {
                autoClassify: true,
                importToJava: true
            })

            if (result.success) {
                toast.success(`Import réussi: ${result.imported_count || 0} produits importés`)
                fetchJobs()
                setFile(null)
                setValidationResult(null)
                setActiveTab('history')
            } else {
                toast.error(result.error || 'Erreur lors de l\'import')
            }
        } catch (error) {
            console.error('Erreur import:', error)
            toast.error('Erreur lors de l\'import du fichier')
        } finally {
            setImporting(false)
        }
    }

    const fetchJobs = async () => {
        try {
            const result = await etlApi.listJobs()
            setJobs(result.jobs || [])
        } catch (error) {
            console.error('Erreur chargement jobs:', error)
        }
    }

    const clearFile = () => {
        setFile(null)
        setValidationResult(null)
        setPreviewData(null)
    }

    const tabs = [
        { id: 'upload', label: 'Import', icon: Upload },
        { id: 'history', label: 'Historique', icon: Clock }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900 dark:text-white">
                        Import ETL
                    </h1>
                    <p className="text-dark-500 mt-1">
                        Importez des produits depuis des fichiers CSV avec traitement ML
                    </p>
                </div>
                <Button variant="outline" onClick={fetchJobs}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Actualiser
                </Button>
            </div>

            {/* Info Banner */}
            <Card className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <Database className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-dark-900 dark:text-white">
                            Pipeline ETL Intelligent
                        </h3>
                        <p className="text-sm text-dark-500 mt-1">
                            Le service Python ML analyse, valide et classifie automatiquement vos données
                            avant de les importer dans le système Java.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="info">Validation automatique</Badge>
                            <Badge variant="info">Classification ML</Badge>
                            <Badge variant="info">Détection d'erreurs</Badge>
                            <Badge variant="info">Import vers Java</Badge>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Tabs */}
            <div className="flex gap-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                                ${activeTab === tab.id
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-400 hover:bg-dark-200'
                                }
                            `}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'upload' && (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                    >
                        {/* Upload Zone */}
                        <Card>
                            <h3 className="font-semibold text-dark-900 dark:text-white mb-4">
                                Téléverser un fichier
                            </h3>

                            <div
                                {...getRootProps()}
                                className={`
                                    border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                                    transition-all duration-200
                                    ${isDragActive
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-dark-300 dark:border-dark-700 hover:border-primary-400'
                                    }
                                `}
                            >
                                <input {...getInputProps()} />

                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-100 dark:bg-dark-800 flex items-center justify-center">
                                    <FileSpreadsheet className="w-8 h-8 text-dark-400" />
                                </div>

                                {isDragActive ? (
                                    <p className="text-primary-600 dark:text-primary-400 font-medium">
                                        Déposez le fichier ici...
                                    </p>
                                ) : (
                                    <>
                                        <p className="text-dark-900 dark:text-white font-medium">
                                            Glissez-déposez un fichier CSV
                                        </p>
                                        <p className="text-dark-500 text-sm mt-1">
                                            ou cliquez pour sélectionner
                                        </p>
                                        <p className="text-dark-400 text-xs mt-2">
                                            CSV, XLS, XLSX (max. 50 MB)
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Selected File */}
                            {file && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-4"
                                >
                                    <div className="flex items-center gap-3 p-3 bg-dark-50 dark:bg-dark-800 rounded-lg">
                                        <FileText className="w-8 h-8 text-primary-500" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-dark-900 dark:text-white truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-sm text-dark-500">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={clearFile}>
                                            <Trash2 className="w-4 h-4 text-danger-500" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Import Button */}
                            {file && validationResult?.valid && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mt-4"
                                >
                                    <Button
                                        onClick={handleImport}
                                        disabled={importing}
                                        className="w-full"
                                    >
                                        {importing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Import en cours...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-4 h-4 mr-2" />
                                                Lancer l'import
                                            </>
                                        )}
                                    </Button>
                                </motion.div>
                            )}
                        </Card>

                        {/* Validation Results */}
                        <Card>
                            <h3 className="font-semibold text-dark-900 dark:text-white mb-4">
                                Résultat de validation
                            </h3>

                            {!validationResult ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Info className="w-12 h-12 text-dark-300 mb-3" />
                                    <p className="text-dark-500">
                                        Sélectionnez un fichier pour voir les résultats de validation
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Status */}
                                    <div className={`
                                        flex items-center gap-3 p-4 rounded-lg
                                        ${validationResult.valid
                                            ? 'bg-success-50 dark:bg-success-900/20'
                                            : 'bg-danger-50 dark:bg-danger-900/20'
                                        }
                                    `}>
                                        {validationResult.valid ? (
                                            <CheckCircle className="w-6 h-6 text-success-500" />
                                        ) : (
                                            <XCircle className="w-6 h-6 text-danger-500" />
                                        )}
                                        <div>
                                            <p className={`font-medium ${validationResult.valid
                                                    ? 'text-success-700 dark:text-success-400'
                                                    : 'text-danger-700 dark:text-danger-400'
                                                }`}>
                                                {validationResult.valid ? 'Fichier valide' : 'Erreurs détectées'}
                                            </p>
                                            {validationResult.row_count && (
                                                <p className="text-sm text-dark-500">
                                                    {validationResult.row_count} lignes détectées
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Detected Columns */}
                                    {validationResult.columns && (
                                        <div>
                                            <p className="text-sm font-medium text-dark-700 dark:text-dark-300 mb-2">
                                                Colonnes détectées:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {validationResult.columns.map((col, i) => (
                                                    <Badge key={i} variant="secondary">{col}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Errors */}
                                    {validationResult.errors?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-danger-700 dark:text-danger-400 mb-2">
                                                Erreurs:
                                            </p>
                                            <ul className="space-y-1">
                                                {validationResult.errors.map((error, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-danger-600">
                                                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                        {error}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Warnings */}
                                    {validationResult.warnings?.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-warning-700 dark:text-warning-400 mb-2">
                                                Avertissements:
                                            </p>
                                            <ul className="space-y-1">
                                                {validationResult.warnings.map((warning, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-warning-600">
                                                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                        {warning}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}

                {activeTab === 'history' && (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card>
                            <h3 className="font-semibold text-dark-900 dark:text-white mb-4">
                                Historique des imports
                            </h3>

                            {jobs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Clock className="w-12 h-12 text-dark-300 mb-3" />
                                    <p className="text-dark-500">Aucun import récent</p>
                                    <Button variant="outline" size="sm" className="mt-4" onClick={fetchJobs}>
                                        Actualiser
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {jobs.map((job, index) => (
                                        <motion.div
                                            key={job.id || index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex items-center gap-4 p-4 bg-dark-50 dark:bg-dark-800 rounded-lg"
                                        >
                                            <div className={`
                                                w-10 h-10 rounded-full flex items-center justify-center
                                                ${job.status === 'completed'
                                                    ? 'bg-success-100 dark:bg-success-900/30'
                                                    : job.status === 'failed'
                                                        ? 'bg-danger-100 dark:bg-danger-900/30'
                                                        : 'bg-warning-100 dark:bg-warning-900/30'
                                                }
                                            `}>
                                                {job.status === 'completed' ? (
                                                    <CheckCircle className="w-5 h-5 text-success-500" />
                                                ) : job.status === 'failed' ? (
                                                    <XCircle className="w-5 h-5 text-danger-500" />
                                                ) : (
                                                    <Loader2 className="w-5 h-5 text-warning-500 animate-spin" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-dark-900 dark:text-white truncate">
                                                    {job.filename || `Import ${job.id}`}
                                                </p>
                                                <p className="text-sm text-dark-500">
                                                    {job.created_at ? new Date(job.created_at).toLocaleString() : 'Date inconnue'}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <Badge variant={
                                                    job.status === 'completed' ? 'success' :
                                                        job.status === 'failed' ? 'danger' : 'warning'
                                                }>
                                                    {job.status === 'completed' ? 'Terminé' :
                                                        job.status === 'failed' ? 'Échec' : 'En cours'}
                                                </Badge>
                                                {job.imported_count && (
                                                    <p className="text-xs text-dark-500 mt-1">
                                                        {job.imported_count} produits
                                                    </p>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preview Section */}
            {previewData && previewData.length > 0 && (
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-dark-900 dark:text-white">
                            Aperçu des données
                        </h3>
                        <Badge variant="info">
                            <Eye className="w-3 h-3 mr-1" />
                            {previewData.length} lignes
                        </Badge>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-dark-200 dark:border-dark-700">
                                    {Object.keys(previewData[0] || {}).map((col) => (
                                        <th key={col} className="px-3 py-2 text-left font-medium text-dark-600 dark:text-dark-400">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {previewData.slice(0, 5).map((row, i) => (
                                    <tr key={i} className="border-b border-dark-100 dark:border-dark-800">
                                        {Object.values(row).map((val, j) => (
                                            <td key={j} className="px-3 py-2 text-dark-900 dark:text-white truncate max-w-48">
                                                {String(val).substring(0, 50)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    )
}
