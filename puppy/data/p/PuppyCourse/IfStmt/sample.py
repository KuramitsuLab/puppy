# サイコロを計算します。

dice = int(random()*6)+1

# 確認のために表示する
print(dice)

# 偶数と奇数は、2で割ったときの余り

print(dice % 2 == 0)
