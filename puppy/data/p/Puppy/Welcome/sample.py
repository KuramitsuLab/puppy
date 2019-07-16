B = Rectangle(500, 950, width=1000, height=100, isStatic=true)
A = Ball(100,100,strokeStyle="yellow",lineWidth=30,width=100,height=100,fillStyle="green")

print("Hello")

def suzume_collision():
    print("Bomb!")
def suzume_clicked():
    print("Chun")
suzume = Circle(500,100,image='bird.png',width=270,clicked=suzume_clicked,collisionStart=suzume_collision)

for x in [100,200,300,400]:
    print('Hi!!', font='48px Arial',fontStyle='green')



