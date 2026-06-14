import { useCallback, useEffect, useMemo, useState } from 'react'

const getItemId = (item) => String(item?.id ?? item?.code ?? item?.key ?? item?.label ?? '')

export const moveIdBefore = (order, sourceId, targetId) => {
  const source = String(sourceId || '')
  const target = String(targetId || '')
  if (!source || !target || source === target) return order

  const next = [...order]
  const sourceIndex = next.indexOf(source)
  const targetIndex = next.indexOf(target)
  if (sourceIndex === -1 || targetIndex === -1) return order

  const [moved] = next.splice(sourceIndex, 1)
  const nextTargetIndex = next.indexOf(target)
  next.splice(nextTargetIndex, 0, moved)
  return next
}

const cleanOrder = (ids, order) => {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean).map(String)))
  const saved = Array.isArray(order) ? order.map(String) : []
  return [
    ...saved.filter((id) => uniqueIds.includes(id)),
    ...uniqueIds.filter((id) => !saved.includes(id)),
  ]
}

const readOrder = (storageKey) => {
  if (typeof window === 'undefined') return []
  try {
    const saved = window.localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    return []
  }
}

const writeOrder = (storageKey, order) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey, JSON.stringify(order))
}

export function useStoredOrder(storageKey, items) {
  const ids = useMemo(() => items.map(getItemId).filter(Boolean), [items])
  const [order, setOrder] = useState(() => cleanOrder(ids, []))

  useEffect(() => {
    setOrder(cleanOrder(ids, readOrder(storageKey)))
  }, [ids, storageKey])

  const moveItem = useCallback((sourceId, targetId) => {
    setOrder((current) => {
      const next = moveIdBefore(cleanOrder(ids, current), sourceId, targetId)
      writeOrder(storageKey, next)
      return next
    })
  }, [ids, storageKey])

  const resetOrder = useCallback(() => {
    const next = cleanOrder(ids, [])
    writeOrder(storageKey, next)
    setOrder(next)
  }, [ids, storageKey])

  const orderedItems = useMemo(() => {
    const clean = cleanOrder(ids, order)
    return clean.map((id) => items.find((item) => getItemId(item) === id)).filter(Boolean)
  }, [ids, items, order])

  return { orderedItems, order: cleanOrder(ids, order), moveItem, resetOrder }
}
