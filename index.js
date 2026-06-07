'use strict';
const express = require('express');
const auth =require('http-auth');
const authConnect = require('http-auth-connect')
const { PrismaClient } =require("@prisma/client")
const prisma = new PrismaClient();


const app = express();
app.use(express.urlencoded({extended: false}));

app.set('view engine', 'pug');

// ダミーデータ
const users =[
  { id: 1, name: '山田太郎'},
  { id: 2, name: '佐藤 花子' },
  { id: 3, name: '鈴木 一郎' },
  { id: 4, name: '高橋 京子' },
  { id: 5, name: '渡辺 恒一' },
  { id: 6, name: '伊藤 恒一' },
  { id: 7, name: '小林 美代子' },
  { id: 8, name: '加藤 恒一' },
  { id: 9, name: '中村 和子' },
  { id: 10, name: '吉田 正夫' }

]

const activityTexts={
  exercise: '体操に積極的に参加され、熱心に身体を動かされていました',
  coloring: '塗り絵に集中して取り組まれ、丁寧に作品を仕上げられていました',
  karaoke: 'カラオケでは楽しそうに歌われ、笑顔が多く見られました',
  recreation: 'レクリエーションに参加され、他利用者様との交流を楽しまれていました',
  rest: '静養を中心に穏やかに過ごされ、体調に大きな変化なく過ごされました',
  relaxing: '落ち着いた様子で穏やかに過ごされ、ご自身のペースで過ごされていました',
  tv: 'テレビ鑑賞を楽しまれ、リラックスした様子で過ごされていました' 
};

// 共通関数
function getUserIds(req){
  let userIds = req.body.userIds || [];
  if(!Array.isArray(userIds)){
    userIds = [userIds];
  }
  return userIds;
}

function getUserName(userId){
  const user = users.find(user => user.id === userId);
  if (user){
    return user.name;
  }
  return '不明';
}

function createNote(activities){
  const texts = activities.map(
    activity => activityTexts[activity]
  );
  if(texts.length === 0){
    return '';
  }

  let note = `本日は${texts[0]}。`;

  for (let i =1; i < texts.length; i++){
    if(i === texts.length - 1){
      note += `さらに、${texts[i]}。`;
    }else{
      note += `また、${texts[i]}。`;
    }
  }
  return note;
}

// ログイン・ログアウト
const basic = auth.basic({
  realm: 'Kaigo Kiroku System',
  file:__dirname + "/users.htpasswd"
});


app.get("/logout",(req,res)=>{
  res.status(401).send("ログアウトしました。ブラウザを閉じるか、再度アクセスしてください")
})

app.use(authConnect(basic));


// トップページ
app.get('/',(req,res)=>{
  res.render('index',{users});
});
// バイタル
app.get('/vital', async (req, res) => {
  const vitalRecords = await prisma.vitalRecord.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  res.render('vital', {
    users,
    vitalRecords,
    getUserName,
    errorMessage: null,
    message: null
  });
});

app.post('/vital', async (req, res) => {
  const { userIds, temperature , systolic,diastolic,pulse} = req.body;

  if (!userIds || !temperature || !systolic || !diastolic || !pulse) {
    const vitalRecords = await prisma.vitalRecord.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.render('vital', {
      users,
      vitalRecords,
      getUserName,
      errorMessage: '⚠ 利用者とバイタルを入力してください',
      message: null
    });
  }

  const selectedUserIds = Array.isArray(userIds) ? userIds : [userIds];

  for (const userId of selectedUserIds) {
    const user = users.find(user => user.id === Number(userId));
    if (!user) continue;

    await prisma.vitalRecord.create({
      data: {
        careUserId: user.id,
        careUserName: user.name,
        temperature: Number(temperature),
        systolic: Number(systolic),
        diastolic:  Number(diastolic),
        pulse:Number(pulse),
        recordDate: new Date()
      }
    });
  }

  const vitalRecords = await prisma.vitalRecord.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  res.render('vital', {
    users,
    vitalRecords,
    getUserName,
    errorMessage: null,
    message: '✓ 登録しました'
  });
});
// 送迎
app.get('/transport', async (req, res) => {
  const transportRecords = await prisma.transportRecord.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  res.render('transport', {
    users,
    transportRecords,
    getUserName,
    errorMessage: null,
    message: null
  });
});

app.post('/transport', async (req, res) => {
  const { userIds, transport } = req.body;

  if (!userIds || !transport) {
    const transportRecords = await prisma.transportRecord.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.render('transport', {
      users,
      transportRecords,
      getUserName,
      errorMessage: '⚠ 利用者とあり・なしを選択してください',
      message: null
    });
  }

  const selectedUserIds = Array.isArray(userIds) ? userIds : [userIds];

  for (const userId of selectedUserIds) {
    const user = users.find(user => user.id === Number(userId));
    if (!user) continue;

    await prisma.transportRecord.create({
      data: {
        careUserId: user.id,
        careUserName: user.name,
        transport: transport,
        recordDate: new Date()
      }
    });
  }

  const transportRecords = await prisma.transportRecord.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  res.render('transport', {
    users,
    transportRecords,
    getUserName,
    errorMessage: null,
    message: '✓ 登録しました'
  });
});
// 機能訓練
app.get('/training', async (req, res) => {
  const trainingRecords = await prisma.trainingRecord.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  res.render('training', {
    users,
    trainingRecords,
    getUserName,
    errorMessage: null,
    message: null
  });
});

app.post('/training', async (req, res) => {
  const { userIds, training } = req.body;

  if (!userIds || !training) {
    const trainingRecords = await prisma.trainingRecord.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.render('training', {
      users,
      trainingRecords,
      getUserName,
      errorMessage: '⚠ 利用者とあり・なしを選択してください',
      message: null
    });
  }

  const selectedUserIds = Array.isArray(userIds) ? userIds : [userIds];

  for (const userId of selectedUserIds) {
    const user = users.find(user => user.id === Number(userId));
    if (!user) continue;

    await prisma.trainingRecord.create({
      data: {
        careUserId: user.id,
        careUserName: user.name,
        training: training,
        recordDate: new Date()
      }
    });
  }

  const trainingRecords = await prisma.trainingRecord.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  res.render('training', {
    users,
    trainingRecords,
    getUserName,
    errorMessage: null,
    message: '✓ 登録しました'
  });
});
// 食事量
app.get('/meal', async (req, res) => {
  const mealRecords = await prisma.mealRecord.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  res.render('meal', {
    users,
    mealRecords,
    getUserName,
    errorMessage: null,
    message: null
  });
});

app.post('/meal', async (req, res) => {
  const { userIds, stapleFood, sideDish } = req.body;

  if (!userIds || !stapleFood || !sideDish) {
    const mealRecords = await prisma.mealRecord.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.render('meal', {
      users,
      mealRecords,
      getUserName,
      errorMessage: '⚠ 利用者と食事量を入力してください',
      message: null
    });
  }

  const selectedUserIds = Array.isArray(userIds) ? userIds : [userIds];

  for (const userId of selectedUserIds) {
    const user = users.find(user => user.id === Number(userId));
    if (!user) continue;

    await prisma.mealRecord.create({
      data: {
        careUserId: user.id,
        careUserName: user.name,
        stapleFood: Number(stapleFood),
        sideDish: Number(sideDish),
        recordDate: new Date()
      }
    });
  }

  const mealRecords = await prisma.mealRecord.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  res.render('meal', {
    users,
    mealRecords,
    getUserName,
    errorMessage: null,
    message: '✓ 登録しました'
  });
});
// 入浴
app.get('/bath', async (req, res) => {
  const bathRecords = await prisma.bathRecord.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  res.render('bath', {
    users,
    bathRecords,
    getUserName,
    errorMessage: null,
    message: null
  });
});

app.post('/bath', async (req, res) => {
  const { userIds, bath } = req.body;

  if (!userIds || !bath) {
    const bathRecords = await prisma.bathRecord.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.render('bath', {
      users,
      bathRecords,
      getUserName,
      errorMessage: '⚠ 利用者とあり・なしを選択してください',
      message: null
    });
  }

  const selectedUserIds = Array.isArray(userIds) ? userIds : [userIds];

  for (const userId of selectedUserIds) {
    const user = users.find(user => user.id === Number(userId));
    if (!user) continue;

    await prisma.bathRecord.create({
      data: {
        careUserId: user.id,
        careUserName: user.name,
        bath: bath,
        recordDate: new Date()
      }
    });
  }

  const bathRecords = await prisma.bathRecord.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });

  res.render('bath', {
    users,
    bathRecords,
    getUserName,
    errorMessage: null,
    message: '✓ 登録しました'
  });
});
// 本日の様子
app.get('/note',async(req,res)=>{
  const noteRecords = await prisma.noteRecord.findMany({
    orderBy:{
      createdAt:"desc"
    }
  })
  res.render('note',{
    users,
    noteRecords,
    getUserName,
    errorMessage:null,
    message:null
  });
});

app.get('/note/edit/:id', async (req, res) => {
  const record = await prisma.noteRecord.findUnique({
    where: {
      id: Number(req.params.id)
    }
  });

  if (!record) {
    return res.redirect('/note');
  }

  res.render('note-edit', {
    record,
    getUserName
  });
});
app.post('/note',async(req,res)=>{
  const userIds = getUserIds(req);
  let activities = req.body.activities || [];

  if(!Array.isArray(activities)){
    activities = [activities];
  }
  const note=createNote(activities); 
  const memo=req.body.memo || '';
  const finalNote = memo
    ? note + '\n' + memo
    : note;

  if (userIds.length === 0 ||activities.length === 0){
    const noteRecords = await prisma.noteRecord.findMany({
      orderBy:{
        createdAt:"desc"
      }
    });
    return res.render('note',{
      users,
      noteRecords,
      getUserName,
      errorMessage: ' ⚠ 利用者と活動を選択してください',
      message: null
    })
  
  }
  
  for (const userId of userIds){
    const user = users.find(user => user.id === Number(userId));
    if (!user) continue;
    
    await prisma.noteRecord.create({
      data:{
        careUserId: user.id,
        careUserName: user.name,
        note: finalNote,
        recordDate: new Date()
      }
    });
  }
  const noteRecords = await prisma.noteRecord.findMany({
    orderBy:{
      createdAt:"desc"
    }
  });

  res.render('note',{
    users,
    noteRecords,
    getUserName,
    message: ' ✓ 登録しました',
    errorMessage:null
  })
});

app.post('/note/edit/:id',async(req,res)=>{
  await prisma.noteRecord.update({
        where:{
          id: Number(req.params.id)
        },
        data:{
          note: req.body.note
        }
      });
    
  res.redirect('/note');
});

// サーバー起動
const PORT = process.env.PORT || 8000
app.listen(PORT,() =>{
  console.log("Server Start");
});