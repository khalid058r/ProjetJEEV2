package com.projetee.sallesmangement.repository;

import com.projetee.sallesmangement.entity.SearchHistory;
import com.projetee.sallesmangement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SearchHistoryRepository extends JpaRepository<SearchHistory, Long> {
    List<SearchHistory> findTop10ByUserOrderBySearchDateDesc(User user);
}