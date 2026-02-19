const CustomForm = `
    type CustomForm {
        _id: String!
        _createdAt: String!
        _updatedAt: String!
        
        formId: String!
        ownerId: String!

        fields: [CustomField!]!

        status: String

        index: Int
        name: String
        description: String
    }

    type CustomField {
        _id: String!
        _createdAt: String!
        _updatedAt: String!

        type: String!
        placeholder: String
        options: [CustomFieldOption!]
        numberFormat: String
        minValue: Float
        maxValue: Float
        decimalPlace: Int
        allowNegative: Boolean
        dateFormat: String
        minDate: String
        maxDate: String
        statement: String
        ratingIcon: String
        maxScale: Int
        minScale: Int
        leftLabel: String
        rightLabel: String
        allowedType: String
        maxSize: Float

        required: Boolean
        question: String
        policy: JSON
        key: String
    }

    type CustomFieldOption {
        value: String!
        color: String
    }

    input CustomFieldPayload {
        _id: String!

        type: String!
        placeholder: String
        options: [CustomFieldOptionPayload!]
        numberFormat: String
        minValue: Float
        maxValue: Float
        decimalPlace: Int
        allowNegative: Boolean
        dateFormat: String
        minDate: String
        maxDate: String
        statement: String
        ratingIcon: String
        maxScale: Int
        minScale: Int
        leftLabel: String
        rightLabel: String
        allowedType: String
        maxSize: Float

        required: Boolean
        question: String
        policy: JSON
        key: String
    }

    input CustomFieldOptionPayload {
        value: String!
        color: String
    }
`;

exports.customTypes = [CustomForm];

exports.rootTypes = `
    type Query {
        customFormById (
            _id: String!
        ): CustomForm
        customForm (
            formId: String!
            ownerId: String
            initialFields: [CustomFieldPayload!]
            defaultStatus: String
        ): CustomForm
        isCustomFormAvailable (
            formId: String!
            ownerId: String!
        ): Boolean!
    }

    type Mutation {
        createCustomForm (
            formId: String!
            ownerId: String!
            initialFields: [CustomFieldPayload!]
            defaultStatus: String
            
            index: Int
            name: String
            description: String
        ): CustomForm!

        updateCustomForm(
            formId: String!
            ownerId: String
            fields: [CustomFieldPayload!]
            
            index: Int
            name: String
            description: String
        ): String!

        toggleCustomFormStatus (
            formId: String!
            ownerId: String
            status: String
        ): String!
    }
`;
