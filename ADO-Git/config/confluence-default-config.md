# Confluence One NZ Configuration

## Overview

This document outlines the Confluence configuration for One NZ organization integration with the Azure DevOps MCP Server. It provides the necessary settings, authentication details, and usage guidelines for seamless collaboration between Confluence and Azure DevOps workflows.

## Scope
applyTo: "**"

## Organization Details

### **Atlassian Cloud Instance**
- **Organization**: One NZ (onenz)
- **Cloud ID**: `7784c19f-e0f4-4419-866e-1ce866da2c03`
- **Base URL**: `https://onenz.atlassian.net`
- **Wiki URL**: `https://onenz.atlassian.net/wiki`
- **Instance Type**: Atlassian Cloud

### **User Configuration**
- **Account ID**: `62c4c63c66d158d6546ed6b2`
- **Email**: `yash.yash@one.nz`
- **Display Name**: Yash Yash
- **Timezone**: Pacific/Auckland
- **Locale**: en-US
- **Team**: Integration and DevOps Tooling (IDS)
- **Organization**: IT - BTE Tribe

## Confluence Spaces

### **Primary Spaces**
1. **DevOps Tools and Platforms Tribe (DTP)**
   - **Space ID**: `554142333`
   - **Key**: `DTP`
   - **Purpose**: DevOps documentation, playbooks, and tooling guides
   - **URL**: `/spaces/DTP`

2. **Enterprise Integration (EI)**
   - **Space ID**: `293372846`
   - **Key**: `EI`
   - **Purpose**: Integration documentation, API references, and technical guides
   - **URL**: `/spaces/EI`
## CQL (Confluence Query Language) Examples

### **Search Recent Pages**
```cql
type = page AND creator = currentUser() ORDER BY created DESC
```

### **Find Pages by Space**
```cql
space = "DTP" AND type = page ORDER BY lastModified DESC
```

### **Search Technical Documentation**
```cql
text ~ space IN ("DTP", "EI") ORDER BY created DESC
```

### **Find Pages with Comments**
```cql
type = page AND space = "DTP" AND comment.count > 0
```

### **Search for Pages Modified This Week**
```cql
type = page AND lastModified >= -7d ORDER BY lastModified DESC
```

### **Find Pages by Title Pattern**
```cql
title ~ "DevOps" AND space IN ("DTP", "EI") ORDER BY created DESC
```

### **Search for Confluence Pages with Attachments**
```cql
type = page AND attachment.count > 0 ORDER BY lastModified DESC
```