---
title: Estrutura do Meu App
type: codetree
---

## src/
### main.go
```go
package main

import "fmt"

func main() {
    fmt.Println("Hello")
}
```

### handlers/
#### api.go
```go
package handlers

func HandleAPI() {
    // lógica aqui
}
```

### models/
#### user.go
```go
package models

type User struct {
    ID   int
    Name string
}
```

## config/
### config.yaml
```yaml
server:
  port: 8080
database:
  host: localhost
```
