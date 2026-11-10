// Colour Connections content: each colour has several pictures a five-year-old
// clearly reads as that colour (checked by eye on a contact sheet, not only by
// measured hue). Paths are relative to assets/art. Left out after review: the
// teal/orange fish (reads green or orange) and the mostly white coconut.
const pic=(label,image)=>({kind:'image',key:image,label,image});
const food=file=>'curated-foods/'+file+'.webp';
export const COLOUR_SETS=[
 {name:'Red',colour:'#e95045',objects:[pic('Apple','objects/apple.webp'),pic('Apple',food('apple-red-whole')),pic('Strawberry','counting/strawberry.webp'),pic('Strawberry',food('strawberry-red')),pic('Tomato',food('tomato-red-whole')),pic('Ladybird','counting/ladybird.webp'),pic('Pomegranate',food('pomegranate-whole-cut')),pic('Toy car','counting/toy-car.webp')]},
 {name:'Orange',colour:'#ffa533',objects:[pic('Orange','objects/orange.webp'),pic('Orange','counting/orange.webp'),pic('Orange',food('orange-fruit-whole')),pic('Pumpkin',food('pumpkin-whole')),pic('Carrot',food('carrot-whole')),pic('Papaya',food('papaya-half'))]},
 {name:'Yellow',colour:'#f4cf48',objects:[pic('Banana',food('banana-yellow-whole')),pic('Duck','objects/duck.webp'),pic('Duckling','counting/duckling.webp'),pic('Sun','objects/sun.webp'),pic('Moon','objects/moon.webp'),pic('Star biscuit','counting/star-biscuit.webp'),pic('Ladoo',food('besan-ladoo-group'))]},
 {name:'Green',colour:'#65a966',objects:[pic('Leaf','objects/leaf.webp'),pic('Tree','objects/tree.webp'),pic('Turtle','counting/turtle.webp'),pic('Broccoli',food('broccoli-floret')),pic('Cucumber',food('cucumber-whole')),pic('Capsicum',food('capsicum-green-whole')),pic('Cabbage',food('cabbage-green-head')),pic('Peas',food('green-peas-pod')),pic('Pear',food('pear-green-whole'))]},
 {name:'Blue',colour:'#3f8fe0',objects:[pic('Toy block','counting/toy-block.webp')]},
 {name:'Purple',colour:'#9b62d1',objects:[pic('Grapes','objects/grapes.webp'),pic('Grapes',food('grapes-purple-bunch')),pic('Yarn','objects/yarn.webp'),pic('Jellyfish','objects/jellyfish.webp')]},
 {name:'Pink',colour:'#f27fb5',objects:[pic('Balloon','objects/balloon.webp'),pic('Flower','counting/flower.webp'),pic('Cotton candy',food('cotton-candy-pink')),pic('Doughnut',food('donut-pink-frosting-sprinkles')),pic('Umbrella','objects/umbrella.webp'),pic('Ice cream',food('ice-cream-cone-2d'))]},
 {name:'Brown',colour:'#9a6233',objects:[pic('Basket','objects/basket.webp'),pic('Nest','objects/nest.webp'),pic('Brownie',food('chocolate-brownie-2d')),pic('Wafer',food('chocolate-wafer-2d'))]}
];
