// 함수 앞에 export를 붙여서 외부에서 가져갈 수 있게 합니다.
// GameScene.js 상단에 작성
//import { applyUpgrade } from './GameUtils.js';

export function calculateDamage(attackerAtk, defenderDef) {
    const finalDamage = attackerAtk - (defenderDef * 0.5);
    return Math.max(1, finalDamage); // 최소 데미지 1 보장
}

// 업그레이드 실행 함수 (GameScene 내부)
export function applyUpgrade(scene, category, tag) {
        //console.log(`강화 시도: 카테고리=${category}, 태그=${tag}`);
        const item = scene.upgrades[category].find(element => element.tag === tag);
        //console.log('업그레이드 아이템:', item);
        //const item = scene.upgrades.find(cat => cat[0].name === category)[tag];
        //해금체크

        if(!item.unlock){
            if(scene.gold < item.cost){
                //console.log("골드가 부족합니다.");
                return;
            }
        }
        // 1. 만렙 체크
        if (item.level >= item.maxLevel) {
            console.log("이미 최대 레벨입니다.");
            return;
        }

        // 2. 비용 체크 (예시: scene.gold가 있다고 가정)
        if (scene.gold < item.cost) {
            //console.log("골드가 부족합니다.");
            return;
        }

        // 3. 비용 차감 및 레벨업
        scene.gold -= item.cost;
        if(item.unlock){
            
        }else{
            item.unlock = true; // 해금 처리
            item.level =item.maxLevel;
            console.log(`${item.name} -> 해금되었습니다!`);
        }
        if(item.level>-1){
            
            item.level++;
            item.cost = Math.floor(item.cost * 1.5); // 다음 레벨 비용 상승
        }else{
            //-1은 무한히 가능한 기능임(수리 등)
        }
        
        

        // 4. 태그에 따른 실제 효과 적용 (이 부분이 switch 문 역할)
        
        //console.log(item.tag.split('_')[0]);
        switch (item.tag.split('_')[0]) {
            case 'wallType':
                scene.stat.armor = item.level;
                scene.getUpgradeItem('stronghold','wallFix').cost = scene.stat.armor;
                scene.getUpgradeItem('stronghold','wallFix_10').cost = scene.stat.armor*10;
                
                //console.log(scene.castleArmor);
                break;
            case 'maxCastleHp':
                scene.stat.hp += 20;
                scene.stat.maxHp += 20;
                break;
            case 'wallFix':
                //console.log(item.value);
                if(scene.stat.hp>= scene.stat.maxHp){
                    //환불
                    scene.gold += item.cost;
                    break
                }else{
                    scene.stat.hp += item.value ; // 현재 체력 증가
                    if (scene.stat.hp > scene.stat.maxHp) scene.stat.hp = scene.stat.maxHp; // 최대 체력 초과 방지
                }
                break;
            // 다른 태그에 대한 효과도 여기에 추가 가능
        }   

        // 5. 변경된 데이터 전체를 다시 registry에 저장 (UIScene 갱신용)
        
        scene.registry.set('gold', scene.gold); // 변경된 골드 레지스트리에 저장
        scene.registry.set('stat',scene.stat);
        scene.registry.set('playerUpgrades', scene.upgrades);
    }