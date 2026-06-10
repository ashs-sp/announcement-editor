import { createContext, useContext, useReducer, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { getTodayISO } from '../utils/dateUtils'

const DocumentContext = createContext(null)

const initialOrderState = {
  sessionNumber: '',      // 屆次（國字大寫，如「十二」）
  orderNumber: '',        // 令字第XXXXXXX號
  regulationName: '',     // 法規名稱
  // 動作組合：至少一個為 true
  doDelete: false,
  doEnact: false,
  doAmend: false,
  deleteArticles: '',     // 刪除的條文（如「第1條、第5條至第8條」）
  enactArticles: '',      // 制定的條文
  amendArticles: '',      // 修正的條文
  // 署名
  signatureTitle: '',     // 職銜
  signatureName: '',      // 名稱
  // 法規附件
  appendixEnabled: false,
  appendixEntries: [],    // [{id, scopeType: 'title'|'articles', title: '', articlesRef: '', content: ''}]
  // 附圖（每頁一張）
  images: [],             // [{id, name, dataUrl}]
}

const initialState = {
  // Navigation
  step: 0, // 0=org, 1=template, 2=editor
  selectedOrgId: null,
  selectedTemplateId: null,

  // Loaded data
  organizations: [],
  templates: [],

  // Document content
  document: {
    meta: {
      date: getTodayISO(),
      docNumber: {
        enabled: false,
        prefix: '',
        number: '',
      },
      attachment: '',
    },
    blocks: [],
    signature: {
      title: '',
      mode: 'title-only', // 'title-only' | 'with-name' | 'without-title-and-name'
      orgMode: 'without-org-name', // 'without-org-name' | 'with-org-name'
      name: '',
    },
    recipients: {
      primary: [],
      secondary: [],
    },
    options: {
      addStamp: false,
      addSealArea: true,
    },
    // 會長令專用欄位
    order: { ...initialOrderState },
  },
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ORGANIZATIONS':
      return { ...state, organizations: action.payload }

    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload }

    case 'SELECT_ORG': {
      const org = state.organizations.find(o => o.id === action.payload)
      return {
        ...state,
        selectedOrgId: action.payload,
        selectedTemplateId: null,
        step: 1,
        document: {
          ...state.document,
          meta: {
            ...state.document.meta,
            docNumber: {
              enabled: org?.docNumberEnabled ?? false,
              prefix: org?.docNumberPrefixes?.[0] ?? '',
              number: '',
            },
          },
          signature: {
            ...state.document.signature,
            title: org?.leaders?.[0]?.title ?? '',
          },
          order: {
            ...state.document.order,
            signatureTitle: org?.leaders?.[0]?.title ?? '',
          },
        },
      }
    }

    case 'SELECT_TEMPLATE': {
      const template = state.templates.find(t => t.id === action.payload)
      const blocks = (template?.blocks || []).map(b => ({
        ...b,
        items: b.type === 'numbered-list' ? [] : undefined,
        content: b.type === 'text' ? '' : undefined,
        _enabled: true,
      }))
      return {
        ...state,
        selectedTemplateId: action.payload,
        step: 2,
        document: {
          ...state.document,
          blocks,
        },
      }
    }

    case 'GO_BACK':
      return {
        ...state,
        step: Math.max(0, state.step - 1),
        ...(state.step === 2 ? { selectedTemplateId: null } : {}),
        ...(state.step === 1 ? { selectedOrgId: null } : {}),
      }

    case 'UPDATE_META':
      return {
        ...state,
        document: {
          ...state.document,
          meta: { ...state.document.meta, ...action.payload },
        },
      }

    case 'UPDATE_DOC_NUMBER':
      return {
        ...state,
        document: {
          ...state.document,
          meta: {
            ...state.document.meta,
            docNumber: { ...state.document.meta.docNumber, ...action.payload },
          },
        },
      }

    case 'UPDATE_BLOCK_CONTENT': {
      const { blockId, content } = action.payload
      return {
        ...state,
        document: {
          ...state.document,
          blocks: state.document.blocks.map(b =>
            b.id === blockId ? { ...b, content } : b
          ),
        },
      }
    }

    case 'TOGGLE_BLOCK': {
      return {
        ...state,
        document: {
          ...state.document,
          blocks: state.document.blocks.map(b =>
            b.id === action.payload ? { ...b, _enabled: !b._enabled } : b
          ),
        },
      }
    }

    case 'ADD_LIST_ITEM': {
      const { blockId, afterId, level } = action.payload
      const newItem = { id: uuidv4(), level: level ?? 1, content: '' }
      return {
        ...state,
        document: {
          ...state.document,
          blocks: state.document.blocks.map(b => {
            if (b.id !== blockId) return b
            const items = [...(b.items || [])]
            if (afterId) {
              const idx = items.findIndex(i => i.id === afterId)
              items.splice(idx + 1, 0, newItem)
            } else {
              items.push(newItem)
            }
            return { ...b, items }
          }),
        },
      }
    }

    case 'UPDATE_LIST_ITEM': {
      const { blockId, itemId, updates } = action.payload
      return {
        ...state,
        document: {
          ...state.document,
          blocks: state.document.blocks.map(b => {
            if (b.id !== blockId) return b
            return {
              ...b,
              items: (b.items || []).map(item =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            }
          }),
        },
      }
    }

    case 'DELETE_LIST_ITEM': {
      const { blockId, itemId } = action.payload
      return {
        ...state,
        document: {
          ...state.document,
          blocks: state.document.blocks.map(b => {
            if (b.id !== blockId) return b
            return { ...b, items: (b.items || []).filter(i => i.id !== itemId) }
          }),
        },
      }
    }

    case 'REORDER_LIST_ITEMS': {
      const { blockId, items } = action.payload
      return {
        ...state,
        document: {
          ...state.document,
          blocks: state.document.blocks.map(b =>
            b.id === blockId ? { ...b, items } : b
          ),
        },
      }
    }

    case 'UPDATE_SIGNATURE':
      return {
        ...state,
        document: {
          ...state.document,
          signature: { ...state.document.signature, ...action.payload },
        },
      }

    case 'UPDATE_RECIPIENTS':
      return {
        ...state,
        document: {
          ...state.document,
          recipients: { ...state.document.recipients, ...action.payload },
        },
      }

    case 'UPDATE_OPTIONS':
      return {
        ...state,
        document: {
          ...state.document,
          options: { ...state.document.options, ...action.payload },
        },
      }

    case 'REORDER_BLOCKS':
      return {
        ...state,
        document: { ...state.document, blocks: action.payload },
      }

    // ──────────────────────────────────────────────
    // 會長令 actions
    // ──────────────────────────────────────────────

    case 'UPDATE_ORDER':
      return {
        ...state,
        document: {
          ...state.document,
          order: { ...state.document.order, ...action.payload },
        },
      }

    case 'ADD_APPENDIX_ENTRY': {
      const newEntry = {
        id: uuidv4(),
        scopeType: 'title',   // 'title' | 'articles'
        title: '',            // 法規標題（scopeType='title' 時使用）
        articlesRef: '',      // 條文參照（scopeType='articles' 時使用）
        content: '',          // 條文內容（多行）
      }
      return {
        ...state,
        document: {
          ...state.document,
          order: {
            ...state.document.order,
            appendixEntries: [...state.document.order.appendixEntries, newEntry],
          },
        },
      }
    }

    case 'UPDATE_APPENDIX_ENTRY': {
      const { entryId, updates } = action.payload
      return {
        ...state,
        document: {
          ...state.document,
          order: {
            ...state.document.order,
            appendixEntries: state.document.order.appendixEntries.map(e =>
              e.id === entryId ? { ...e, ...updates } : e
            ),
          },
        },
      }
    }

    case 'DELETE_APPENDIX_ENTRY': {
      return {
        ...state,
        document: {
          ...state.document,
          order: {
            ...state.document.order,
            appendixEntries: state.document.order.appendixEntries.filter(
              e => e.id !== action.payload
            ),
          },
        },
      }
    }

    case 'REORDER_APPENDIX_ENTRIES': {
      return {
        ...state,
        document: {
          ...state.document,
          order: {
            ...state.document.order,
            appendixEntries: action.payload,
          },
        },
      }
    }

    case 'ADD_ORDER_IMAGE': {
      return {
        ...state,
        document: {
          ...state.document,
          order: {
            ...state.document.order,
            images: [...state.document.order.images, action.payload],
          },
        },
      }
    }

    case 'DELETE_ORDER_IMAGE': {
      return {
        ...state,
        document: {
          ...state.document,
          order: {
            ...state.document.order,
            images: state.document.order.images.filter(img => img.id !== action.payload),
          },
        },
      }
    }

    default:
      return state
  }
}

export function DocumentProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const actions = {
    setOrganizations: useCallback((orgs) => dispatch({ type: 'SET_ORGANIZATIONS', payload: orgs }), []),
    setTemplates: useCallback((tpls) => dispatch({ type: 'SET_TEMPLATES', payload: tpls }), []),
    selectOrg: useCallback((id) => dispatch({ type: 'SELECT_ORG', payload: id }), []),
    selectTemplate: useCallback((id) => dispatch({ type: 'SELECT_TEMPLATE', payload: id }), []),
    goBack: useCallback(() => dispatch({ type: 'GO_BACK' }), []),
    updateMeta: useCallback((p) => dispatch({ type: 'UPDATE_META', payload: p }), []),
    updateDocNumber: useCallback((p) => dispatch({ type: 'UPDATE_DOC_NUMBER', payload: p }), []),
    updateBlockContent: useCallback((blockId, content) =>
      dispatch({ type: 'UPDATE_BLOCK_CONTENT', payload: { blockId, content } }), []),
    toggleBlock: useCallback((blockId) => dispatch({ type: 'TOGGLE_BLOCK', payload: blockId }), []),
    addListItem: useCallback((blockId, afterId, level) =>
      dispatch({ type: 'ADD_LIST_ITEM', payload: { blockId, afterId, level } }), []),
    updateListItem: useCallback((blockId, itemId, updates) =>
      dispatch({ type: 'UPDATE_LIST_ITEM', payload: { blockId, itemId, updates } }), []),
    deleteListItem: useCallback((blockId, itemId) =>
      dispatch({ type: 'DELETE_LIST_ITEM', payload: { blockId, itemId } }), []),
    reorderListItems: useCallback((blockId, items) =>
      dispatch({ type: 'REORDER_LIST_ITEMS', payload: { blockId, items } }), []),
    updateSignature: useCallback((p) => dispatch({ type: 'UPDATE_SIGNATURE', payload: p }), []),
    updateRecipients: useCallback((p) => dispatch({ type: 'UPDATE_RECIPIENTS', payload: p }), []),
    updateOptions: useCallback((p) => dispatch({ type: 'UPDATE_OPTIONS', payload: p }), []),
    reorderBlocks: useCallback((blocks) => dispatch({ type: 'REORDER_BLOCKS', payload: blocks }), []),

    // 會長令
    updateOrder: useCallback((p) => dispatch({ type: 'UPDATE_ORDER', payload: p }), []),
    addAppendixEntry: useCallback(() => dispatch({ type: 'ADD_APPENDIX_ENTRY' }), []),
    updateAppendixEntry: useCallback((entryId, updates) =>
      dispatch({ type: 'UPDATE_APPENDIX_ENTRY', payload: { entryId, updates } }), []),
    deleteAppendixEntry: useCallback((entryId) =>
      dispatch({ type: 'DELETE_APPENDIX_ENTRY', payload: entryId }), []),
    reorderAppendixEntries: useCallback((entries) =>
      dispatch({ type: 'REORDER_APPENDIX_ENTRIES', payload: entries }), []),
    addOrderImage: useCallback((img) => dispatch({ type: 'ADD_ORDER_IMAGE', payload: img }), []),
    deleteOrderImage: useCallback((id) => dispatch({ type: 'DELETE_ORDER_IMAGE', payload: id }), []),
  }

  return (
    <DocumentContext.Provider value={{ state, actions }}>
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocument() {
  const ctx = useContext(DocumentContext)
  if (!ctx) throw new Error('useDocument must be used within DocumentProvider')
  return ctx
}

export function useOrg() {
  const { state } = useDocument()
  return state.organizations.find(o => o.id === state.selectedOrgId) || null
}

export function useTemplate() {
  const { state } = useDocument()
  return state.templates.find(t => t.id === state.selectedTemplateId) || null
}
