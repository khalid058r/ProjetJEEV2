from app.services.csv_processor import CsvProcessorService

processor = CsvProcessorService()
processor.set_available_categories(['Electronics', 'Books', 'Gaming'])

result = processor.process_csv(
    csv_path="data/uploads/test_products.csv",
    auto_fix=True,
    create_categories=True
)

print("=" * 60)
print("📊 RÉSULTATS DÉTAILLÉS")
print("=" * 60)
print(f"Total lignes:        {result['total_lines']}")
print(f"✅ Valides:          {result['valid_count']}")
print(f"⚠️  À réviser:        {result['needs_review_count']}")
print(f"❌ Rejetées:         {result['rejected_count']}")
print(f"⏱️  Temps:            {result['processing_time_seconds']}s")
print()
print("📁 Fichiers générés:")
print(f"   Valid:    {result['valid_csv_path']}")
print(f"   Rejected: {result['rejected_csv_path']}")
print()
print("📋 Erreurs détectées:")
for error_type, count in result['summary']['error_breakdown'].items():
    print(f"   {error_type}: {count}")
print(f"\n🔧 Auto-fixées: {result['summary']['auto_fixed_count']}")
print("\n✅ Test complet terminé!")
