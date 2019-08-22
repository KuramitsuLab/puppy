# n回、繰り返す

反復は、ループの構造とも呼ばれ、プログラムの基本構造です。

色々な書き方がありますが、まずは一番簡単な「n回繰り返す」方法を
覚えましょう。

```python
for i in range(N):
  ＜繰り返したい処理＞
```

例えば、'Hello World'を100回繰り返したいのなら

```python
for i in range(100):
  print('Hello World')
```

変数 i には、0 から 99までの値が順番に与えられます。

これで何回、'Hello World'を表示したか数えることができます。

```python
for i in range(100):
  print(i)
  print('Hello World')
```
注意： インデントによって、反復される処理の範囲が決まります。

### 練習

1. 10 から0 までカウントダウンを表示してみよう。
2. 掛け算の九九を表示してみよう。




```python
for i in [1,2,3]:
  print('Hello World')
```