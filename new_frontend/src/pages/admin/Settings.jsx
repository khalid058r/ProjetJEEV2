import React from 'react';

export default function Settings() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Paramètres de la Plateforme</h1>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold mb-4">Configuration Générale</h2>
                <form>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom du magasin</label>
                        <input type="text" className="w-full border rounded-lg p-2" defaultValue="Mon E-Commerce JEE" />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact</label>
                        <input type="email" className="w-full border rounded-lg p-2" defaultValue="admin@shop.com" />
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                        <button type="button" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                            Sauvegarder
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}