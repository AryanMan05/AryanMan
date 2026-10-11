import React, { useEffect, useState } from 'react'
import { BookOpen, Search, Filter, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../lib/api'

export default function Conditions() {
  const [conditions, setConditions] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchConditions = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (selectedCategory) params.category = selectedCategory
      if (search) params.search = search

      const [condRes, catRes] = await Promise.all([
        api.get('/conditions', { params }),
        api.get('/conditions/categories')
      ])
      setConditions(condRes.data || [])
      setCategories(catRes.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConditions()
  }, [selectedCategory, search])

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-indigo-600" />
          Medical Condition Library & Evidence Index
        </h1>
        <p className="text-slate-600 text-sm mt-1 font-medium">
          Explore evidence-based clinical summaries, warning indicators, and self-care measures.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conditions, symptoms, or keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm shadow-sm transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-indigo-500 text-sm shadow-sm transition"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Conditions Accordion List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500 font-medium">Loading conditions library...</div>
        ) : conditions.length > 0 ? (
          conditions.map((item) => {
            const isExpanded = expandedId === item.id
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden transition shadow-sm hover:shadow-md"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold uppercase">
                      {item.category}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900">{item.name}</h3>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 text-sm bg-slate-50/50">
                    {item.description && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Clinical Overview</h4>
                        <p className="text-slate-800 leading-relaxed font-medium">{item.description}</p>
                      </div>
                    )}

                    {item.symptoms && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Typical Symptoms</h4>
                        <p className="text-slate-700 font-medium">{item.symptoms}</p>
                      </div>
                    )}

                    {item.prevention && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Prevention & Management</h4>
                        <p className="text-slate-700 font-medium">{item.prevention}</p>
                      </div>
                    )}

                    {item.treatments && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Standard Treatment Modalities</h4>
                        <p className="text-slate-700 font-medium">{item.treatments}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center text-slate-500 font-medium shadow-sm">
            No medical conditions matched your search query.
          </div>
        )}
      </div>
    </div>
  )
}
