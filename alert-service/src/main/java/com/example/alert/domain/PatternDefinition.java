package com.example.alert.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "pattern_definition")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatternDefinition {
    public static final String ID = "_id";
    public static final String PATTERN_NAME = "pattern_name";
    public static final String PATTERN_TYPE = "pattern_type";
    public static final String PATTERN_DEFINITION = "pattern_definition";

    @Id
    private String id;

    @Field(PATTERN_NAME)
    private String patternName;

    @Field(PATTERN_TYPE)
    private String patternType;

    @Field(PATTERN_DEFINITION)
    private String patternDefinition;
}
