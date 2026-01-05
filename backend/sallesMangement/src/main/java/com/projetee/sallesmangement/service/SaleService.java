package com.projetee.sallesmangement.service;

import com.projetee.sallesmangement.dto.sale.SaleRequest;
import com.projetee.sallesmangement.dto.sale.SaleResponse;
import com.projetee.sallesmangement.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.List;

public interface SaleService {

    SaleResponse create(SaleRequest request);

    SaleResponse get(Long id);

    // List<SaleResponse> getAll();
    List<SaleResponse> getAll(Long userId, Role role);

    // Page<SaleResponse> getPaginated(int page, int size);
    Page<SaleResponse> getPaginated(Long userId, Role role, int page, int size);

    List<SaleResponse> getRecent(int limit);

    SaleResponse cancel(Long id);

    void delete(Long id);
}
