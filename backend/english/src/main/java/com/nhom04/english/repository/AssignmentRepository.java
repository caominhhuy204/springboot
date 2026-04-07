package com.nhom04.english.repository;

import com.nhom04.english.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findAllByDeletedAtIsNull();
    Optional<Assignment> findByIdAndDeletedAtIsNull(Long id);
    long countByDeletedAtIsNull();
}
