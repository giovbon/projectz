---
title: Workshop de Go
type: slides
theme: black
---

# Workshop de Go 🐹

Uma introdução prática à linguagem Go

---

## Por que Go?

- ⚡ Compilação rápida
- 🧵 Concorrência nativa (goroutines)
- 📦 Binary único
- 🔒 Tipagem estática
- 🧹 Garbage collector eficiente

---

## Hello World

```go
package main

import "fmt"

func main() {
    fmt.Println("Olá, mundo!")
}
```

---

## Goroutines

```go
go func() {
    fmt.Println("executando em paralelo")
}()
```

Milhares de goroutines? Sem problema.

---

# Obrigado! 🎉

Dúvidas?
