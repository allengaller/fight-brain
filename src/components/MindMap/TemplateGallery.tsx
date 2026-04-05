import { X } from 'lucide-react'
import { useTemplates } from '@/utils/templates'
import { useMindMapStore } from '@/store/mindmapStore'

const t = (zh: string, en: string, lang: 'zh' | 'en') => (lang === 'zh' ? zh : en)

interface TemplateGalleryProps {
  open: boolean
  onClose: () => void
}

export function TemplateGallery({ open, onClose }: TemplateGalleryProps) {
  const { templates, apply } = useTemplates()
  const language = useMindMapStore((s) => s.settings.language)
  const loadMindmap = useMindMapStore((s) => s.loadMindmap)

  if (!open) return null

  const handleSelect = (id: string) => {
    const tree = apply(id, language)
    if (tree) {
      loadMindmap(tree)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label={t('模板库', 'Templates', language)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t('模板库', 'Templates', language)}
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label={t('关闭', 'Close', language)}>
            <X size={18} />
          </button>
        </div>
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {templates.map((template) => (
              <button
                key={template.id}
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 border-2 border-transparent transition-all text-center"
                onClick={() => handleSelect(template.id)}
              >
                <span className="text-2xl">{template.icon}</span>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {language === 'zh' ? template.name : template.nameEn}
                </div>
                <div className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
                  {language === 'zh' ? template.description : template.descriptionEn}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
