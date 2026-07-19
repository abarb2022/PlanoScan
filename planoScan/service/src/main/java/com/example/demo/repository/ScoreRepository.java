package com.example.demo.repository;

import com.example.demo.entity.Score;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ScoreRepository extends JpaRepository<Score, UUID> {
  Optional<Score> findBySubmissionId(UUID submissionId);
}
