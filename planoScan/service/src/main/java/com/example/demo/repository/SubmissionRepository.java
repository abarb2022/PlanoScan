package com.example.demo.repository;

import com.example.demo.entity.Submission;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionRepository extends JpaRepository<Submission, UUID> {
  boolean existsByRepId(UUID repId);
}
