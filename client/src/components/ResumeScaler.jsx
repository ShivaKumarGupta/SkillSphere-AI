import { useRef, useState, useEffect } from 'react'

const PAGE_W = 794 // an A4 page is 210 mm wide
const PAGE_CONTENT_H = 1017 // printable height of one A4 page with 14 mm margins
const DOC_PADDING = 106 // the document's top and bottom padding in the preview

export default function ResumeScaler({ children }) {
  const outer = useRef(null)
  const inner = useRef(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState(1123)

  useEffect(() => {
    const measure = () => {
      if (!outer.current || !inner.current) return
      setScale(Math.min(1, outer.current.clientWidth / PAGE_W))
      setHeight(inner.current.offsetHeight)
    }

    // The observer runs once when it starts, then again whenever the column or the content changes size
    const observer = new ResizeObserver(measure)
    observer.observe(outer.current)
    observer.observe(inner.current)
    return () => observer.disconnect()
  }, [])

  const pages = Math.max(1, Math.ceil(Math.max(0, height - DOC_PADDING) / PAGE_CONTENT_H))

  return (
    <div>
      <div ref={outer} className="w-full overflow-hidden" style={{ height: height * scale }}>
        <div
          ref={inner}
          style={{ width: PAGE_W, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {children}
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">
        {pages === 1
          ? 'Fits on about 1 page.'
          : `About ${pages} pages. Most recruiters prefer one page for freshers.`}{' '}
        This is an estimate, so check the print preview before sending.
      </p>
    </div>
  )
}