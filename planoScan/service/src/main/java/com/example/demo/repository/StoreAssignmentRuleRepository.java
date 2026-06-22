package com.example.demo.repository;

import com.example.demo.entity.StoreAssignmentRule;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface StoreAssignmentRuleRepository extends JpaRepository<StoreAssignmentRule, UUID> {}
