package com.example.alert.repository;

import com.example.alert.domain.PatternDefinition;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PatternDefinitionRepository extends MongoRepository<PatternDefinition, String> {
}
