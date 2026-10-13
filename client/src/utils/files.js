import api from '../api/axios'

// Opens a private file in a new tab. The tab is opened first so the popup blocker allows it.
export const openFile = async (id) => {
  const tab = window.open('', '_blank')
  try {
    const res = await api.get(`/files/${id}`, { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    if (tab) tab.location.href = url
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch {
    if (tab) tab.close()
  }
}