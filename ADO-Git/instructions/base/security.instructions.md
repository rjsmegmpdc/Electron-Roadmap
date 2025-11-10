# Backlog Refinement Agent - Security Guidelines

## Overview
This document outlines security requirements and data handling protocols for the Backlog Refinement Agent to ensure secure operations within the Azure DevOps and Confluence environments.

## Scope
applyTo: "**"

## Data Classification and Handling

### Sensitive Data Categories
- **Confidential**: Strategic business information, financial data, customer details
- **Internal**: Team structure, project details, technical specifications
- **Public**: General documentation, public-facing content

### Data Handling Rules
- ❌ **No sensitive data** in public spaces or repositories
- ✅ **Proper classification** of all generated content
- ✅ **Access controls** on restricted content and work items
- ✅ **Data minimization** - collect only necessary information
- ✅ **Retention policies** - follow organizational data lifecycle rules

## Authentication and Authorization

## Azure DevOps Specific Security

### Work Item Security
- **Field-level permissions** - respect restricted fields
- **Area path security** - enforce team boundaries
- **Iteration permissions** - validate sprint access
- **Link permissions** - verify cross-project link rights

### Project Security
- **Project-level isolation** - respect project boundaries
- **Team access controls** - follow team membership rules
- **Process template security** - use approved templates only
- **Extension permissions** - validate required capabilities

## Confluence Specific Securitys

### Page and Space Security
- **Space permissions** - respect space access controls
- **Page restrictions** - enforce view/edit permissions
- **Content labels** - use labels for content classification
- **Attachment security** - validate file uploads and links

### Content Security
- **Macro restrictions** - use approved macros only
- **External links** - validate external content safety
- **Embedded content** - secure iframe and widget usage
- **Version control** - maintain content change history

## Security Monitoring

### Monitoring Alerts
- **Unusual access patterns** - detect anomalous behavior
- **Failed authentication** - track login failures
- **Permission violations** - alert on access denials
- **Data exposure risks** - identify potential leaks

