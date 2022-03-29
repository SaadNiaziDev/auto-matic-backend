const cron = require("node-cron");
const User = require("../models/User.js");

const cronJob = async () => {
  cron.schedule("* * */24 * * *", async () => {
    console.log("CRON RUNNING AFTER A DAY");
    var d = new Date(Date.now()-(21*24*3600000));   //21 days * 24 hours * 60 minutes
    var arr= new Array();
    const id = await User.find();
    let query = {
      'depositAmount.date': { $lt: d },
    };
    for(let i = 0; i <id.length; i++) {
        await User.findOne({depositAmount:id[i].depositAmount},(err,result) => {
            if(err) {
                console.log(err);
            }else if(result){
                arr=result.depositAmount;
                console.log(arr);
                for(let y=0;y<arr.length;y++) {
                    if(arr[y].date<d){
                        arr.splice(y,1);
                    }
                }
                console.log(arr);
                result.depositAmount=arr;
                result.save();
            }
        });
      };
    }
  )
};
module.exports = cronJob;