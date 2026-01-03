package com.projetee.sallesmangement.entity;

public enum SaleStatus {
    // Statuts existants (ne pas modifier)
    CREATED,
    CONFIRMED,
    CANCELLED,

    // Nouveaux statuts Click & Collect
    PENDING_PICKUP, // Commande passée, en attente de préparation
    READY_PICKUP, // Commande prête à récupérer en magasin
    COMPLETED // Commande récupérée par le client
}