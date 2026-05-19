import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { useMindMapStore } from '@/store/mindmapStore'
import { PRESET_MODELS } from '@/constants'
import type { CustomAction } from '@/types'

const t = (zh: string, en: string, lang: 'zh' | 'en') => (lang === 'zh' ? zh : en)

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const settings = useMindMapStore((s) => s.settings)
  const updateSettings = useMindMapStore((s) => s.updateSettings)
  const lang = settings.language

  const [activeTab, setActiveTab] = useState<'llm' | 'general' | 'actions'>('llm')
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number | null>(null)
  const customActions = useMindMapStore((s) => s.customActions)
  const addCustomAction = useMindMapStore((s) => s.addCustomAction)
  const removeCustomAction = useMindMapStore((s) => s.removeCustomAction)

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value)
    setSelectedPresetIdx(idx)
    const preset = PRESET_MODELS[idx]
    if (preset) {
      updateSettings({
        llm: {
          ...settings.llm,
          baseUrl: preset.baseUrl || settings.llm.baseUrl,
          model: preset.model || settings.llm.model,
          apiKey: preset.apiKeyRequired ? settings.llm.apiKey : '',
        },
      })
    }
  }

  const currentPreset = selectedPresetIdx != null ? PRESET_MODELS[selectedPresetIdx] : null
  const needsApiKey = !currentPreset || currentPreset.apiKeyRequired

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-gray-100 dark:border-gray-800">
          <TabButton active={activeTab === 'llm'} onClick={() => setActiveTab('llm')}>
            LLM Configuration
          </TabButton>
          <TabButton active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
            {t('通用', 'General', lang)}
          </TabButton>
          <TabButton active={activeTab === 'actions'} onClick={() => setActiveTab('actions')}>
            {t('自定义动作', 'Custom Actions', lang)}
          </TabButton>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'llm' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preset Model
                </label>
                <select
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  value={selectedPresetIdx ?? ''}
                  onChange={handlePresetChange}
                >
                  <option value="">Select a preset...</option>
                  {PRESET_MODELS.map((preset, i) => (
                    <option key={i} value={i}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Base URL
                </label>
                <input
                  type="url"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                  value={settings.llm.baseUrl}
                  onChange={(e) =>
                    updateSettings({ llm: { ...settings.llm, baseUrl: e.target.value } })
                  }
                  placeholder="https://api.moonshot.cn/v1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Model Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                  value={settings.llm.model}
                  onChange={(e) =>
                    updateSettings({ llm: { ...settings.llm, model: e.target.value } })
                  }
                  placeholder="kimi-k2.5"
                />
              </div>

              {needsApiKey && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                    value={settings.llm.apiKey}
                    onChange={(e) =>
                      updateSettings({ llm: { ...settings.llm, apiKey: e.target.value } })
                    }
                    placeholder="sk-..."
                  />
                  <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                    Your API key is stored locally in your browser and never sent to any server except the LLM API endpoint.
                  </p>
                </div>
              )}
              {!needsApiKey && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg">
                  <div>
                    <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      {t('本地模式', 'Local Mode', lang)}
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-500">
                      {t('无需 API Key，确保 Ollama 已运行', 'No API Key needed. Ensure Ollama is running', lang)}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('自定义系统提示词', 'Custom System Prompt', lang)}
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                  rows={3}
                  value={settings.customSystemPrompt}
                  onChange={(e) => updateSettings({ customSystemPrompt: e.target.value })}
                  placeholder={t('留空使用默认提示词。可自定义 AI 的角色和行为。', 'Leave empty to use default. Customize the AI role and behavior.', lang)}
                />
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  {t('替换 AI 操作的默认系统提示词，留空则使用内置提示词。', 'Overrides the default system prompt for all AI actions. Leave empty for built-in.', lang)}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Expand Count
                </label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  value={settings.expandCount}
                  onChange={(e) =>
                    updateSettings({ expandCount: Math.max(2, Math.min(10, Number(e.target.value))) })
                  }
                />
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  Number of sub-topics generated per AI expand action.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <div className="flex gap-3">
                  {(['light', 'dark'] as const).map((theme) => (
                    <button
                      key={theme}
                      className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
                        settings.theme === theme
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => updateSettings({ theme })}
                    >
                      {theme === 'light' ? 'Light' : 'Dark'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto Fit View
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {t('修改后自动适应视口', 'Automatically fit the mind map to viewport after changes', lang)}
                  </div>
                </div>
                <ToggleSwitch
                  checked={settings.autoFit}
                  onChange={(checked) => updateSettings({ autoFit: checked })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('初始展开层级', 'Initial Expand Level', lang)}
                </label>
                <select
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  value={settings.initialExpandLevel}
                  onChange={(e) => updateSettings({ initialExpandLevel: Number(e.target.value) })}
                >
                  <option value={-1}>{t('全部展开', 'Expand All', lang)}</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {t(`${n} 层`, `Level ${n}`, lang)}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  {t('首次加载或重置时的展开深度，-1 表示全部展开。大型脑图建议设为 2-3 层以提升性能。', 'Expand depth on first load. -1 expands all. For large maps, 2-3 is recommended for performance.', lang)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('语言', 'Language', lang)}
                </label>
                <div className="flex gap-3">
                  {(['zh', 'en'] as const).map((l) => (
                    <button
                      key={l}
                      className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all ${
                        settings.language === l
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => updateSettings({ language: l })}
                    >
                      {l === 'zh' ? '中文' : 'English'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <CustomActionsPanel
              actions={customActions}
              onAdd={addCustomAction}
              onRemove={removeCustomAction}
              lang={lang}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

const ACTION_ICONS = ['🚀', '💡', '🎯', '🔬', '🎨', '📊', '🔍', '✨', '🔧', '📝']

function CustomActionsPanel({
  actions,
  onAdd,
  onRemove,
  lang,
}: {
  actions: CustomAction[]
  onAdd: (action: CustomAction) => void
  onRemove: (id: string) => void
  lang: 'zh' | 'en'
}) {
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [icon, setIcon] = useState('🚀')

  const handleAdd = () => {
    if (!name.trim() || !prompt.trim()) return
    onAdd({ id: crypto.randomUUID(), name: name.trim(), prompt: prompt.trim(), icon })
    setName('')
    setPrompt('')
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t(
          '创建自定义 AI 动作，将显示在右键菜单中。支持变量: {path}, {node}, {children}, {count}',
          'Create custom AI actions shown in the context menu. Variables: {path}, {node}, {children}, {count}',
          lang,
        )}
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {t('动作名称', 'Action Name', lang)}
        </label>
        <div className="flex gap-2">
          <select
            className="px-2 py-2 text-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
          >
            {ACTION_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
          <input
            className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('例如: 翻译为英文', 'e.g. Translate to English', lang)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {t('提示词模板', 'Prompt Template', lang)}
        </label>
        <textarea
          className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`{node}\n\n{t('请将以上内容翻译为英文，返回 JSON 数组。', 'Translate the above to English. Return as JSON array.', lang)}`}
        />
      </div>

      <button
        onClick={handleAdd}
        disabled={!name.trim() || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
      >
        <Plus size={16} />
        {t('添加动作', 'Add Action', lang)}
      </button>

      {actions.length > 0 && (
        <div className="space-y-2">
          {actions.map((action) => (
            <div key={action.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <span className="text-lg">{action.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{action.name}</div>
                <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{action.prompt}</div>
              </div>
              <button
                onClick={() => onRemove(action.id)}
                className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
