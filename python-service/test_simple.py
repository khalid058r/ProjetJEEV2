print("🚀 Début du test...")

try:
    from app.services.csv_processor import CsvProcessorService
    print("✅ Import OK")
    
    processor = CsvProcessorService()
    print("✅ Instance créée")
    
    processor.set_available_categories(['Electronics', 'Books'])
    print("✅ Catégories définies")
    
    print("\n📂 Traitement du CSV...")
    result = processor.process_csv(
        csv_path="data/uploads/test_products.csv",
        auto_fix=True,
        create_categories=True
    )
    
    print("\n✅ SUCCÈS!")
    print(f"Total: {result['total_lines']}")
    print(f"Valides: {result['valid_count']}")
    print(f"Rejetées: {result['rejected_count']}")
    
except FileNotFoundError as e:
    print(f"❌ Fichier non trouvé: {e}")
    
except ImportError as e:
    print(f"❌ Erreur d'import: {e}")
    import traceback
    traceback.print_exc()
    
except Exception as e:
    print(f"❌ Erreur: {e}")
    import traceback
    traceback.print_exc()

print("\n🏁 Fin du test")
