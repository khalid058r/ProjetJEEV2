import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios'; // Ton client axios configuré
import { Search, History, Sparkles } from 'lucide-react'; // Icônes

export default function SemanticSearch() {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const navigate = useNavigate();

    // Récupérer les suggestions IA quand on tape
    useEffect(() => {
        if (query.length > 2) {
            const fetchSuggestions = async () => {
                try {
                    const res = await api.get(`/search/suggestions?q=${query}`);
                    setSuggestions(res.data);
                } catch (e) { console.error(e); }
            };
            const timer = setTimeout(fetchSuggestions, 300); // Debounce
            return () => clearTimeout(timer);
        }
    }, [query]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            setShowSuggestions(false);
            // Rediriger vers la page de résultats (à créer ou existante)
            navigate(`/catalog?search=${encodeURIComponent(query)}`);
        }
    };

    return (
        <div className="relative w-full max-w-xl mx-auto">
            <form onSubmit={handleSearch} className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Recherche sémantique (ex: 'PC pour gamer pas cher')..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all shadow-sm"
                />
                <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                <button type="submit" className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    <Sparkles className="w-4 h-4" />
                </button>
            </form>

            {/* Dropdown des Suggestions */}
            {showSuggestions && (suggestions.length > 0) && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Suggestions IA
                    </div>
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => { setQuery(s); handleSearch({ preventDefault: () => {} }); }}
                            className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex items-center gap-3 text-gray-700 transition-colors"
                        >
                            <History className="w-4 h-4 text-gray-400" />
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}