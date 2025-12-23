package com.projetee.sallesmangement.service;

import com.projetee.sallesmangement.dto.lignevente.LigneVenteRequest;
import com.projetee.sallesmangement.dto.lignevente.LigneVenteResponse;
import org.springframework.data.domain.Page;

public interface LigneVenteService {

    LigneVenteResponse addLine(Long saleId, LigneVenteRequest request);

    LigneVenteResponse updateLine(Long lineId, LigneVenteRequest request);

    void deleteLine(Long lineId);

    LigneVenteResponse get(Long id);

    Page<LigneVenteResponse> getPaginated(int page, int size);

}
