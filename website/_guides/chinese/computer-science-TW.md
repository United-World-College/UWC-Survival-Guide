---
title: "關於 Computer Science"
category: "UWC 之後的日子"
description: "從學科分支到 career path，一份關於 CS 的學科綜述。"
order: 2
author_id: "william-huang"
original_language: "zh-CN"
guide_id: "computer-science"
language_code: "zh-TW"
language_name: "台灣繁體"
language_folder: "chinese"
language_sort: 3
published: 2026-05-10
updated: 2026-05-10
---


這是專業篇的第一篇文章，這個系列的初衷是希望透過科普的形式向大家介紹不同學科在本科階段作為一個專業究竟是什麼樣的，有哪些細分領域以及哪些常見的 career path。第一篇我想先講一講 CS，帶著大家從大學的視角來看我對這個學科的理解究竟是什麼樣的，和我高中時候的認識有什麼不同。

我最開始對 CS 的興趣是小時候玩機器人的時候培養起來的，那時候會寫一些簡單的程式碼控制機器人完成一些 deterministic 的任務，我記得最開始就是樂高機器人的那種；後來我參加過一些演算法競賽，學習了一些 competitive programming 的技巧。接著在高中的時候又做過一兩個 AI 相關的小項目，這大概就是我上大學以前對 CS 這個學科的 mental model。但是上了大學以後我發現這個 mental model 立刻就 fall apart 了。現在回想起來那時候接觸的這些東西真的只是一些皮毛而已，CS 作為一個學科還是有很多不同的領域和值得研究的問題的。但這正是這個學科的最讓我欽佩的地方所在：它不像一些學科高高在上拒人於千里之外；恰恰相反，CS 透過自己不同層級的 abstraction 可以讓不同知識背景的人都參與其中，感受到它的魅力。比方說我相信本文的大部分讀者不一定懂得大模型的原理，但每天都在 benefit from it。然後對於稍微 advanced 一點的人來說可以 dive deeper，比如使用 coding agent 來寫程式做項目，或者是呼叫一個 LLM 的 API 來完成一些任務。接著有更多知識儲備的人可以在大模型這條線上繼續深挖，比方說對特定任務做微調，甚至是預訓練，開發相關演算法，研究相關數學理論等等。對於每個人來說都可以在大模型這個領域內有自己的一席之地。但其實大模型這條線只是目前比較 popular 的 AI 方向的一個子領域而已，除此之外這門學科還有很多其他分支和領域，比如系統、理論等。這也就是為什麼 CS 同時具有 vertical accessibility 和 horizontal heterogeneity。

說實話，CS 這門學科之所以具有 horizontal heterogeneity 是因為它本身就是數學、ECE、物理、語言學、認知科學等等很多學科高度耦合的產物。也正因為如此，它內部不同的細分領域之間的界限往往是模糊的。對於具體怎麼分類，不同的視角會有不同的分類方法，但不同方法之間差距不會太大。在這裡我會參考 [CSRankings](https://csrankings.org/#/index?all&us) 這個網站上面的分類方法，從做 research 的角度來進行分析。

## 關於 CSRankings

在正式開始之前我想先簡單介紹一下 CSRankings。這個網站在 CS 圈子裡被公認是衡量學校科研實力的一個不錯參考，它的排名是完全按照每個學校的 faculty 在每個領域的頂會裡面發表文章的數量來進行加權計算的。這個計算方法相對公平，但也會有對應的問題。首先是它沒法區分 groundbreaking work 和 incremental work（這兩種在它的統計裡都算是一篇文章，也就是 publication += 1，但實際影響力可能差了好幾個數量級）；其次，它統計的是 conference 而不是 journal（順便提一下，CS 的 convention 是把文章優先發表在會議而不是期刊，因為 CS 技術迭代太快，期刊審稿週期往往是會議的幾倍，所以完全沒法跟上），但這種統計方式對個別偏好 journal 的教授和子領域（比如 biocomputing）來說就是一個巨大的 disadvantage；此外還有一點就是 faculty 數量多的學校天然佔優勢，因為假設兩個學校的教授的平均水平相同，那教授多的學校自然數值就會更高。但這一點也不完全是 bias，因為 faculty 多確實意味著 ecosystem 更厚。對於這些具體的問題我會留到之後的選校部分再慢慢展開，這裡只是先請讀者注意一下 CSRankings 並不是完美的排名，但它對了解每個學校的實力還是有重要參考價值的，而且它本身也是一個不錯的領域劃分指南。

好了現在言歸正傳。在 CSRankings 上 CS 這個學科大致被分成了四個大類：AI、Systems、Theory，以及一些 Interdisciplinary 的領域。雖說每個領域是相對自成一體的，對於每個領域甚至是內部的子領域的細分方向都會有各自的 community，但我一直覺得這四個 cluster 之間有一個邏輯上的附屬關係：Theory 是最 foundational 的部分，提供 algorithm 和 computation 本身的數學基礎；Systems 則是在 Theory 之上建立起了實際能運行的硬體和軟體 infrastructure；AI 又在 Systems 之上延伸出能從資料中學習的應用；Interdisciplinary 則是 CS 和其他學科（生物、經濟、藝術等）的交叉，一般來說會更加偏向應用一些。當然這些也都不是絕對的，像是 AI 這個領域裡面其實也存在著大量的理論研究方向，比如 learning theory 之類的。下面我會按照剛剛提出的這個邏輯順序依次介紹。

## Theory：CS 的數學基礎

Theory 這個領域大致在做的事情是研究 computation 本身的數學性質，也就是什麼問題能算、什麼問題算不出來、能算的問題需要多少 resource、怎麼 prove 一個 algorithm 是 optimal 的。這些都是 CS 這個學科的基石，為談論 computation 提供了具體的語言和工具。而在 CSRankings 上 theory 又被進一步分成三個子方向：Algorithms & Complexity、Cryptography 以及 Logic & Verification。

### Algorithms & Complexity

Algorithms & Complexity 是 theory 裡最經典的方向。我記得原來打演算法競賽的時候做每道題之前最重要的一件事就是先看資料規模和題目的 constraint 來挑選合適的演算法，這樣才能保證在題目規定的時間複雜度以內解決問題。對於 research 而言這個 spirit 是一樣的，只不過要解決的問題會複雜很多：algorithm 研究的是怎麼設計更快的演算法解決具體問題，比如圖演算法、近似演算法、線上演算法、隨機演算法這些；complexity 則是反過來，研究的是某一類問題至少需要多少 resource（時間、空間、隨機性等等）才能被解決，給演算法設計畫一條理論上的下界。兩條線一個在往下推上界、一個在往上推下界，最終目標是把它們對齊。比如基於比較的排序的下界已經被證明是 $\Omega(n \log n)$，而 [merge sort](https://en.wikipedia.org/wiki/Merge_sort)、[heap sort](https://en.wikipedia.org/wiki/Heapsort) 這些演算法剛好都打到這個下界，那麼排序在比較模型下就算是有定論了。但很多更難的問題，比如[矩陣乘法](https://en.wikipedia.org/wiki/Matrix_multiplication_algorithm)、[全源最短路徑](https://en.wikipedia.org/wiki/Shortest_path_problem)，它們的上下界之間到現在還有不小的 gap，這就是 algorithm 和 complexity 這個領域一直在研究的東西。著名的 [P vs NP 問題](https://en.wikipedia.org/wiki/P_versus_NP_problem)就屬於 complexity 的範疇，而這道題懸而未決已經五十多年，被 [Clay 數學研究所](https://en.wikipedia.org/wiki/Clay_Mathematics_Institute)列為七個 [Millennium Prize Problems](https://en.wikipedia.org/wiki/Millennium_Prize_Problems) 之一。

### Cryptography

Cryptography 表面上像是 algorithm 的一個應用，但其實它有自己一整套獨立的理論框架。它研究的是怎麼在有對手存在的環境下保證資訊的機密性、完整性和真實性。這個方向特殊的地方在於 security 的定義都是建立在某個 complexity 假設之上的，比如 [RSA](https://en.wikipedia.org/wiki/RSA_cryptosystem) 的安全性建立在大整數分解很難這一假設之上。所以 cryptography 和 complexity 是天然糾纏在一起的：你必須先有一個 hardness assumption，才能在它之上搭建 crypto scheme。近幾年這個領域比較火的方向有 [post-quantum cryptography](https://en.wikipedia.org/wiki/Post-quantum_cryptography)（擔心未來的量子電腦會破掉現在主流的 crypto，所以提前設計能抵抗量子攻擊的方案）、[zero-knowledge proof](https://en.wikipedia.org/wiki/Zero-knowledge_proof)（讓一方在不洩露任何額外資訊的前提下證明自己知道某個秘密，是很多 blockchain 系統的底層），以及 [multi-party computation](https://en.wikipedia.org/wiki/Secure_multi-party_computation) 等等。

### Logic & Verification

Logic & Verification 這條線相對小眾一些，但解決的問題非常實在：怎麼用 formal method 在數學層面證明一段程式、或者一個系統是正確的？比如一個 OS kernel、一個編譯器、一個分散式協定，怎麼保證它在所有輸入下都不會 crash、不會洩露資料、不會出現 race condition？這就是 verification 要回答的問題。這個方向和 systems 領域內的 PL（programming languages）社群有很深的交集，因為很多 verification 工具本身就建立在類型系統、operational semantics 這些 PL 概念之上。

這一段對沒接觸過 verification 的讀者來說可能有點抽象，但可以拿演算法競賽打個比方：在演算法競賽、日常軟體開發這些場景裡，驗證一段程式碼正不正確，靠的基本都是寫大量測試案例去跑一遍，而不是去做 formal verification。所謂測試案例其實很好理解，比方說我手上有一個函式 $f(x) = x^2$，那輸入 $2$ 就應該輸出 $4$，輸入 $3$ 就應該輸出 $9$，以此類推。所以只要寫大量測試案例來檢驗一個輸入是否能得到對應的輸出就可以了，成本相對 formal verification 來說很低。因為測試案例本質上只檢查有限 specific input 是否得到正確 output，而不是像 formal verification 那樣在數學上證明對所有可能的 input 程式都滿足要求。但現實裡的問題往往要複雜很多的，總會有測試案例沒覆蓋到的 corner case；對大部分軟體開發來說這些遺漏其實無傷大雅，我們每天在用的 [Chrome](https://en.wikipedia.org/wiki/Google_Chrome) 這類產品裡其實就存在著大量已知和未知的 bug，做這種產品的核心邏輯是快速迭代而不是萬無一失。這是一種 tradeoff，使用者可以忍一忍小毛病，下一版更新裡修一下就行了，但放到航空航太、加密貨幣這些場景裡，一個沒考慮到的 corner case 可能就直接出人命或者虧掉一大筆錢，這種時候才值得花成倍的成本去做 formal verification。

晶片設計其實也是同一個道理。一顆晶片一旦流片就沒法再打補丁了，做出來的幾百萬顆裡只要有一個 corner case 被觸發，可能就是整批召回的損失。一個經典的例子是 1994 年 [Intel](https://en.wikipedia.org/wiki/Intel) Pentium 的 [FDIV bug](https://en.wikipedia.org/wiki/Pentium_FDIV_bug)，因為浮點除法在某些極端輸入下會算錯，最後 Intel 花了將近五億美元做召回。所以現代晶片在 tape out 之前一般都會用大量 formal method 去證明設計在所有合法輸入下都滿足規約。

Theory 整體對數學背景的要求很高，平時的工作大多發生在白板上而不是在 IDE 裡，論文裡也幾乎全是證明而不是實驗。所以如果不是發自內心喜歡推理和證明，在這個方向上孤軍奮戰會比較辛苦。但反過來說，theory 的成果壽命也是 CS 裡最長的，一篇好的演算法論文常常會被引用幾十年，而 systems 和 AI 那邊因為技術迭代實在太快，五年前的 SOTA 現在可能已經無人問津了。

## Systems：讓 computation 真正跑起來

Systems 這個 cluster 是 CS 裡 footprint 最大的一塊，它涵蓋了幾乎所有讓 computation 真正能在硬體上跑起來所需要的基礎設施，從最底層的晶片設計一路往上到 OS、網路、資料庫、PL、SE 等等。systems 的研究風格和 theory 幾乎完全相反：theory 是在紙上推公式證定理，systems 則非常 hands-on，幾乎每篇論文都要做出一個真實的原型，再去測它的性能（延遲、吞吐量、功耗這些），用實測資料來支撐自己的結論。所以 systems 的論文經常會附帶很大體量的程式碼。

繼續從演算法競賽的角度來看的話，algorithm 做的就是如何降低時間複雜度，而 systems 當然也做讓演算法跑得更快這件事（也就是優化常數），但實際上它負責的事情要比這個雜得多，還包括怎麼讓多執行緒不出 race condition、機器掛掉怎麼不丟資料、給上層什麼樣的介面才好用等等。這些大多都跟跑得快不快沒什麼關係，但都是 systems 這條線要負責的事情。

CSRankings 把 systems 拆成了大約十幾個子方向，下面挑幾個比較有代表性的簡單聊聊。

### Computer Architecture

Computer Architecture 是 systems 裡最貼近硬體的方向，研究的是 CPU、GPU、TPU 這些晶片內部應該怎麼設計：cache 層級怎麼組織、指令集是 RISC 還是 CISC、流水線怎麼排、怎麼處理分支預測和記憶體一致性等等。最近幾年隨著 [Moore's Law](https://en.wikipedia.org/wiki/Moore%27s_law) 慢慢失速，單純堆電晶體的紅利已經幾乎沒有了，所以 architecture 這條線的精力大量轉向了為特定 workload（比如深度學習、圖計算、cryptography）設計專門的加速器。[Google](https://en.wikipedia.org/wiki/Google) 的 [TPU](https://en.wikipedia.org/wiki/Tensor_Processing_Unit)、[NVIDIA](https://en.wikipedia.org/wiki/Nvidia) 的 [Tensor Core](https://en.wikipedia.org/wiki/Volta_(microarchitecture)) 都是這個趨勢的產物。

### Operating Systems

Operating Systems 主要研究 OS kernel 應該怎麼設計：怎麼調度行程、怎麼管理記憶體、怎麼處理 I/O、怎麼實現檔案系統等等。這個領域近些年比較活躍的幾個方向包括 unikernel（把應用和核心合併成一個單一目的的二進位檔來榨乾性能）、verified microkernel（在 microkernel 拆分架構的基礎上用 formal method 證明 kernel 核心實現的正確性），以及針對新硬體（比如 persistent memory、SmartNIC、disaggregated memory）做的 OS 改造。

### Networking

Networking 研究的是資料怎麼在機器之間高效可靠地傳輸：從區域網路內部的交換機設計，到跨資料中心的廣域網路，再到 Internet 上的路由協定，都屬於這個領域。這兩年這條線上很多研究都聚焦在資料中心網路上，因為雲端運算和大模型訓練的需求，大家越來越關心怎麼在資料中心內部做到極低延遲、不堵塞的通訊。

### High-Performance Computing

High-Performance Computing 研究的是怎麼把一份計算 scale 到上萬個節點上高效跑完。這條線傳統的 application 是解決科學問題，比如氣候模擬、流體力學、第一性原理材料計算等。這些都是[國家級超算](https://en.wikipedia.org/wiki/TOP500)每天在做的事，背後的數學本質是 PDE 求解、大規模線性代數這一類 numerical methods 的工作。說實話，我感覺 HPC 更像是 systems 領域裡集大成者於一身的方向，既和 architecture、network 這些方向高度交叉，又要特別關注應用數學裡的 numerical stability 這些細節。另外值得一提的是，這兩年大模型訓練其實就直接建立在 HPC 幾十年攢下來的基礎設施上。GPU 叢集、節點間高速互連、collective communication 這些本來就是 HPC 一直在做的事，整個大模型的訓練棧基本就是在這上面發展出來的。

這裡順帶提一下 numerical methods。它本質上是應用數學的一個分支，當放在 CS 裡面討論的時候它一般被歸納在 scientific computing 這個更大的領域內。一般來說 scientific computing 除了 numerical methods 之外還包括了 HPC 實現、計算物理／化學／生物這些領域科學，以及科學軟體的研發和工程優化。因為 numerical methods 最常落地的平台就是 HPC，所以這兩個 community 有不少交集，甚至很多時候就是同一群人。其實 numerical methods 在做的事情很簡單，那就是解決數學和電腦本質上的錯位。這個錯位主要有兩個不同的來源，一個是連續和離散之間的差異：數學裡很多對象本質上是連續的，比如導數、積分、PDE 的解、矩陣的特徵值，但電腦只能處理離散、有限步的運算，所以導數得變成差分、積分得變成求和、PDE 得變成網格上的代數方程、特徵值得靠迭代去逼近；另一個錯位是 floating point 本身：電腦用浮點數近似實數，每一步都會丟一點 roundoff，規模一大就一路累積下去導致最後的計算結果可能就不能用了。Numerical methods 這個領域做的事就是要解決這兩個問題，讓演算法既能保證收斂性、效率上也不至於太離譜。

到了大模型時代，在訓練模型的時候連續和離散這一層其實基本不影響，因為訓練本身已經是離散的矩陣乘法，沒有什麼需要做離散化的連續對象，但 floating point 這一層是真正的核心問題。大模型訓練本質上就是海量浮點運算的累加，numerical stability 一旦沒處理好，loss 就會突然 spike、模型直接訓崩，動輒上千萬美元的損失。這也是為什麼 mixed precision（用 FP16 / BF16 / FP8 這些低精度格式提性能，但 FP16 自己就會帶來 stability 問題）、loss scaling（用來補 FP16 的 gradient underflow，BF16 因為指數位和 FP32 一樣寬通常用不上）、以及更精細的 scaling 策略這些 numerical-systems 交叉方向會是大模型訓練的重頭戲。

### Database

Database 研究的是怎麼存、怎麼索引、怎麼查詢大量資料。一個現代的資料庫系統要解決的問題非常多：怎麼在保證 [ACID](https://en.wikipedia.org/wiki/ACID) 的前提下做並行事務、怎麼把查詢分發到多台機器上、怎麼優化 SQL 查詢計劃、怎麼處理串流資料等等。這兩年比較火的方向有記憶體資料庫、雲端原生資料庫（像 [Snowflake](https://en.wikipedia.org/wiki/Snowflake_Inc.)、[BigQuery](https://en.wikipedia.org/wiki/BigQuery) 這種），以及專門為大模型 retrieval 設計的向量資料庫。

### Programming Languages

Programming Languages 研究的是程式語言本身：語言怎麼設計、類型系統怎麼搭、編譯器怎麼把高階程式碼翻譯成機器碼。不同語言其實代表著不同的設計 tradeoff，比如演算法競賽和高頻交易常用的 C++ 給了使用者完全的記憶體控制，速度很快但很容易 use-after-free、buffer overflow；Java、Python 這些用 garbage collector 接管記憶體，安全但有執行開銷；Rust 這幾年很火，靠 ownership 和 borrow checker 在編譯期就把記憶體安全檢查掉了，讓使用者既不用 GC 又能避開 C++ 那些最折磨人的錯誤。PL 這個領域和上面提到的 formal verification 有很深的交集，所以兩邊的社群有不少交流。

### Security

Security 這個子方向橫跨的層次很廣，從底層的硬體安全（比如 [Spectre](https://en.wikipedia.org/wiki/Spectre_(security_vulnerability))、[Meltdown](https://en.wikipedia.org/wiki/Meltdown_(security_vulnerability)) 這種側通道攻擊）到作業系統安全、網路安全，再到應用層的 web security 和 ML security，幾乎每一層都有自己的攻擊模型和防禦機制。

### Software Engineering

Software Engineering 研究的是大規模程式碼庫應該怎麼組織、怎麼測試、怎麼維護。這個領域因為 AI 的興起也變得非常活躍，比如程式合成、自動修 bug、自動寫測試案例都是當下挺熱的話題。需要說明的是，作為學術研究的 Software Engineering 和大廠裡我們常說的 SWE（軟體工程師）這個職業其實關係不大，只是名字一樣而已。而 SWE 究竟是什麼則會放在之後 career path 的部分詳談。

Systems 研究的問題大多來自真實的工程痛點，所以這個領域的學術界和工業界關係特別緊密。當然這也不是絕對的，像是剛才提到的 software engineering 就是一個反例：它作為 research topic 所關心的大規模程式碼庫應該怎麼組織、code review 怎麼 scale、CI/CD pipeline 怎麼設計這些問題，對於 Google 等大廠而言，因為自身 codebase 體量極大，早就 accumulate 了遠超學術界的一手經驗，相關 best practice 也往往是工業界先開發出來的。學術界裡 software engineering researcher 的獨特 contribution 是把這些 industry pattern 系統化，但最原始的 problem-solving frontier 確實往往都在工業界。

Systems 對人的要求和 theory 方向恰恰相反：它整體對工程能力的要求很高，平時的工作大多發生在終端和 profiler 裡而不是在白板上，論文裡也幾乎全是 benchmark 和實測資料而不是數學證明。所以如果沒有真的享受寫程式、和真實硬體死磕的過程，這個方向會顯得比較枯燥乏味。但從另一個角度來說，systems 的成果落地速度也是 CS 裡最快的之一，一篇有分量的 paper 幾年之內就有可能被工業界吸收成為標準實踐，在博士期間就有可能看到自己親手搭出來的系統真的被部署。

## AI：讓電腦從感知到決策

AI 是 CS 裡這幾年發展最快、關注度最高的方向，幾乎不用過多介紹。但 AI 內部其實也分了很多不同的子方向，下面簡單展開一下。

CSRankings 把 AI 大致分成 AI（general）、Computer Vision、Machine Learning & Data Mining、Natural Language Processing、Web & Information Retrieval 這幾個方向。但說實話，自從 [transformer](https://en.wikipedia.org/wiki/Transformer_(deep_learning)) 在 2017 年橫空出世、之後又催生出 GenAI 這一波浪潮以來，這些子方向之間的界限已經越來越模糊。以前 vision 和 NLP 是兩個相對獨立的社群，現在大家都用同一套 backbone（transformer）和同一套範式（pretrain + finetune），多模態模型也開始一統天下。所以下面我會按照現在實際的研究 landscape 來講，而不嚴格遵循 CSRankings 的分類。

### Foundation Model

Foundation Model 是這兩年最熱的方向。它的核心問題是怎麼訓練一個能在很多任務上泛化的模型，具體研究的子問題包括架構設計（attention 機制怎麼改、怎麼處理長上下文）、訓練（pretraining 的資料配比、scaling law、RLHF 這些）、推理（怎麼加速、怎麼量化、怎麼做 speculative decoding）以及評測（怎麼設計真正能衡量模型能力的 benchmark）等等。這個方向非常依賴算力，很多最前沿工作只能在 industry lab（[OpenAI](https://en.wikipedia.org/wiki/OpenAI)、[Anthropic](https://en.wikipedia.org/wiki/Anthropic)、[Google DeepMind](https://en.wikipedia.org/wiki/Google_DeepMind) 等）裡做，因為學術界很難擁有訓練一個前沿模型所需要的那種規模的 GPU 叢集。

### Computer Vision

Computer Vision 研究模型怎麼理解圖像和影片，具體任務包括分類、檢測、分割、生成等等。在大模型時代之前，CV 是一個相對自洽的方向，有自己的 backbone（[ResNet](https://en.wikipedia.org/wiki/Residual_neural_network)、[ViT](https://en.wikipedia.org/wiki/Vision_transformer) 這些）和自己的任務集；但現在 vision 越來越多地被合併到多模態模型裡去了。生成這條線目前也很活躍，[diffusion model](https://en.wikipedia.org/wiki/Diffusion_model)、影片生成都是當下的熱點。

### Natural Language Processing

Natural Language Processing 研究模型怎麼理解和生成自然語言。這個領域基本已經被 LLM 重塑了。以前的 NLP 任務（翻譯、摘要、問答這些）現在都成了 LLM 的下游應用，所以 NLP 的研究重心也很大程度上轉移到了 LLM 本身的能力和對齊上。

### Reinforcement Learning

Reinforcement Learning 研究的是 agent 怎麼透過和環境互動學到一個最優策略。RL 在過去十年走過一段挺有意思的路：曾經它最有名的應用是下棋打遊戲（[AlphaGo](https://en.wikipedia.org/wiki/AlphaGo)、[AlphaStar](https://en.wikipedia.org/wiki/AlphaStar_(software))），後來一度被認為不太實用；但近兩年 [RLHF](https://en.wikipedia.org/wiki/Reinforcement_learning_from_human_feedback) 讓它在 LLM 訓練裡成了不可或缺的一環，又重新回到了聚光燈下。這兩年的 reasoning model（OpenAI 的 o 系列、[DeepSeek](https://en.wikipedia.org/wiki/DeepSeek) 的 R 系列）更是把 RL 推到了 LLM 訓練流水線的中心位置。

### ML Theory

ML Theory 研究的是 ML 的數學性質：為什麼深度網路能泛化、optimization landscape 長什麼樣、為什麼過參數化的模型不會過擬合等等。這個方向和前面 theory 那部分其實有挺深的交集，需要很強的數學功底。

### AI for Science

AI for Science 是這幾年才崛起的一個交叉方向，主要把 ML 用在具體的科學問題上。最有名的例子是 DeepMind 的 [AlphaFold](https://en.wikipedia.org/wiki/AlphaFold)，它基本解決了 [protein structure prediction](https://en.wikipedia.org/wiki/Protein_structure_prediction) 這個生物學界懸而未決五十年的問題，並因此拿到了 2024 年的諾貝爾化學獎。除此之外 AI for math、AI for materials science 這些也都是越來越受關注的方向。順帶提一句，如何使用 AI 做前面在理論方向中提到的 formal verification 從而降低其成本其實就是現在 AI for math 這個領域內最重要的研究問題之一。

說實話我覺得 AI 這個方向更像是 theory 和 systems 融合的產物，跨度非常之廣。這個領域的研究既可以非常偏向理論又可以非常偏向系統。所以這也就對人的要求特別高。最頂尖的 AI researcher 往往都是數學和工程兩手都過硬的 full-stack researcher，既能推 scaling law 這些理論分析，又能在幾千張 GPU 上把一整套訓練流程穩定跑起來。這種 profile 在任何其他 CS 子領域裡都不算多見，但在 AI 領域幾乎已經成了頂級 lab 的標配。

此外，從個人發展的角度來說，AI 大概是目前 CS 裡錢最多、就業最好的方向之一，但與此同時也極度內捲、迭代極快，一篇 paper 掛到 arxiv 上，三個月之後可能就過時了。所以在這個方向待下去需要一種特別的心態：既要跟得上社群的節奏，又要在各種 hype 裡保持判斷力，不被裹挾。

## Interdisciplinary：CS 和其他學科的交叉

最後一個 cluster 是 interdisciplinary，也就是 CS 和別的學科之間的交叉地帶。這部分的子方向大多是把 CS 的方法和工具用到某個具體領域的問題上，所以做這條線一般需要雙重背景。下面挑幾個有代表性的方向簡單展開。

### Computational Biology / Bioinformatics

Computational Biology / Bioinformatics 是把 CS 用在生物學問題上的方向。具體的任務包括基因測序、蛋白質結構預測、藥物發現、單細胞分析這些，前面提到的 AlphaFold 也算這個領域的標誌性成果。這條線因為生物學本身的資料規模和複雜度都在飛速增長，加上 ML 工具又越來越強，未來很長一段時間大概率都會是一個增長方向。

### Computer Graphics

Computer Graphics 研究的是怎麼用電腦生成、表示、操作視覺內容，像電影特效、遊戲渲染、3D 建模、物理模擬都屬於這個範疇。近些年隨著 VR/AR 的發展和 generative model 的進步，這個領域也變得越來越活躍，比如 [NeRF](https://en.wikipedia.org/wiki/Neural_radiance_field)、[Gaussian Splatting](https://en.wikipedia.org/wiki/Gaussian_splatting) 這些技術就是把傳統 graphics 和現代 ML 結合起來的成功案例。

### Human-Computer Interaction

Human-Computer Interaction 研究的是人和電腦之間的互動：UI/UX 怎麼設計、accessibility 怎麼處理、AR/VR 怎麼做、新型輸入裝置怎麼設計。HCI 是 CS 裡最 user-facing 的方向之一，所以它的研究經常會涉及使用者研究、心理學這些傳統上不算 CS 的方法論。當然現在隨著 GenAI 的爆發也有不少人開始研究 AI 和人的互動以及對社會的影響，這些也都屬於 HCI 的範疇。

### Robotics

Robotics 研究的是怎麼讓物理 agent 在真實世界裡感知、推理、行動。這個領域天然橫跨 ML、控制理論、機械工程等好幾個學科。最近隨著 LLM 的進步，把 LLM 當作機器人的高層規劃器也成了一個挺活躍的研究方向。

### Economics & Computation

Economics & Computation 是 CS 和經濟學的交叉，某種程度上和 Operations Research 挺像的，研究的問題包括機制設計（比如一場拍賣怎麼設計才能讓大家誠實出價）、algorithmic game theory、市場設計這些。這條線和工業界的關係也挺緊密，Google、[Meta](https://en.wikipedia.org/wiki/Meta_Platforms) 這些公司的廣告競價系統背後就有大量這方面的研究在支撐。

### Visualization

Visualization 研究的是怎麼把高維或者複雜的資料用人能看懂的方式展示出來。這個方向雖然小眾，但在資料科學、科學計算這些場景裡非常重要。

### CS Education

CS Education 研究的是 CS 應該怎麼教。具體研究的問題包括語言設計（怎麼設計一種對初學者友好的程式語言）、教學法（怎麼教抽象、怎麼教遞迴）以及 access equity（怎麼讓更多 underrepresented group 進入這個學科）等等。

Interdisciplinary 這個 cluster 整體的選擇面非常廣，適合那些除了 CS 還對某個具體領域有興趣的人。它另外一個好處是：因為問題來源比較多樣，funding 也比較分散，所以受單一領域 hype 週期的影響相對小一些。

回到文章開頭的問題：上了大學以後會發現 CS 是一門什麼樣的學科？對我自己來說最大的體會就是：CS 比高中階段接觸的 coding 和演算法競賽要廣得多。它既可以是一門極其數學的學科（比如 theory 的部分），也可以是一門極其工程的學科（比如 systems 的部分），還可以是一門和幾乎任何其他學科交叉的學科（甚至包括法律、哲學等等）。每個人都能在裡面找到一個適合自己背景和興趣的方向，這也是我開頭提到的 horizontal heterogeneity 的真正含義。

對於學弟學妹們來說這裡還有一點值得注意：上面對每個方向的介紹只是想讓大家對這個學科的 landscape 有一個基本的認識，並不是讓大家現在就想好 commit 到哪一個領域。其實我見過很多人即使到本科快結束了都還沒有一個特別 concrete 的想法，這完全沒問題。大部分人最後的 commitment 也只是因為覺得某個方向有前途，或者恰好收到了某個特定方向的教授或者公司崗位的 offer，就這麼定下來了。我介紹了這麼多只是希望大家對 CS 這門學科多一些了解，看看裡面有沒有哪個小角落讓自己 feel right，而不是要現在就給大家施加什麼壓力。

## CS 選校

在正式進入這章之前，我推薦讀者先行閱讀[〈關於選校〉]({{ '/guides/chinese/school-selection-TW/' | relative_url }})一篇，因為在這裡會使用到不少那一篇裡面已經介紹過的分析方法和結論。此外需要說明的一點是，這個 section 會延續之前 research 視角的領域分類方法，主要從做本科教學和學術研究的角度來分析各個學校。而就業導向的分析則會留到下一個 section。

### 教學風格 spectrum

首先是我個人覺得對於本科生而言不同學校的 CS program 大致可以放在一個 spectrum 上，一端是 math-heavy 的教學風格，另一端則是 engineering-heavy 的教學風格。當然不同的教學風格其實某種程度上也反映了這個學校的 research 風格。

Math-heavy 的項目最典型的特徵是 theory 類課程在本科必修裡佔比高、math prerequisite 重。典型代表是 [Princeton](https://en.wikipedia.org/wiki/Princeton_University)、[Cornell](https://en.wikipedia.org/wiki/Cornell_University)、[Caltech](https://en.wikipedia.org/wiki/California_Institute_of_Technology) 等學校，必修課會要求學生有很強的讀和寫 proof 的能力。這一類學校比較適合想做 ML theory、cryptography、formal methods 這種 math-heavy 方向的人。

Engineering-heavy 項目的典型特徵則是 systems 類課程在本科 curriculum 裡佔比高、必修課 project load 重、hands-on training 多。典型代表是 [CMU](https://en.wikipedia.org/wiki/Carnegie_Mellon_University)、[UIUC](https://en.wikipedia.org/wiki/University_of_Illinois_Urbana-Champaign)、[Georgia Tech](https://en.wikipedia.org/wiki/Georgia_Institute_of_Technology) 等學校，畢業時學生一般會有大量系統程式設計的 hands-on 經驗。此外很多 mid-tier R1 在 systems 方向做得也非常深，比如 [NC State](https://en.wikipedia.org/wiki/North_Carolina_State_University) 和 [UTK](https://en.wikipedia.org/wiki/University_of_Tennessee) 的 engineering 文化重，而且這兩所學校在 HPC 方向都是最頂尖的。這些學校比較適合想做 systems、industry-bound SWE、applied ML 的人。

中間地帶是像 [MIT](https://en.wikipedia.org/wiki/Massachusetts_Institute_of_Technology)、[Stanford](https://en.wikipedia.org/wiki/Stanford_University)、[UC Berkeley](https://en.wikipedia.org/wiki/University_of_California,_Berkeley) 等 math 和 engineering 雙修的 culture，必修課同時包含 proof-heavy theory course 和 implementation-heavy systems course。但代價是必修 load 重，對於不少"普通優秀"的同學來說容易進退維谷。

對於大部分文理學院來說這個情況又會有所不同，他們的風格一般不會有這麼大的差異。正如我在[〈關於選校〉]({{ '/guides/chinese/school-selection-TW/' | relative_url }})一文中所提到的，因為[文理學院的 lab 資源有限]({{ '/guides/chinese/school-selection-TW/#lac-與-stem-的錯位' | relative_url }})，所以他們 default 重視理論；但 [Harvey Mudd](https://en.wikipedia.org/wiki/Harvey_Mudd_College) 是個例外，他們的整個 program 是出名的 engineering-heavy。

對於看完之後開始糾結的學弟學妹而言，這個 spectrum 裡其實並沒有一個永遠正確的選項，我覺得它更像是一個 self-auditing tool：你需要誠實問自己 "我喜歡的是 proof 還是 implementation、是理論還是 applied science、是 mathematical clarity 還是 engineering elegance"，然後選 spectrum 上 fit 你的位置。當然對於比較好的 R1 CS program 而言，不論學校本身是 math-heavy 還是 engineering-heavy，在每個領域裡都會有世界級的教授，所以即使現在 commit 了一個教學重心沒那麼契合的學校，也可以多上一點自己感興趣的領域的選修課或者去找對應領域的專家一起做 research。這其實就是 faculty 數量多的一個非常大的好處。

### CSRankings 的局限性與各校強項

在這裡順帶說一下 CSRankings 的一個 known limitation——一個學校的排名很大程度上反映的是 institutional total output 而不是 per-faculty quality，所以 faculty 數量少但人均水平高的 department 在排名上會被顯著 understate。這一點在之前介紹 CSRankings 時就 promise 過會在選校部分展開。Caltech 是這個 limitation 最典型的受害者：這個學校本身就非常小，一屆大概就 200 多個本科生；CS department 也是很小的，faculty 數量很少，所以就導致了他們雖然有著不少很厲害的教授，但是在 CSRankings 上的排名卻非常低。那有什麼辦法能稍微 hedge 一下這個 bias 呢？其實非常簡單：實際操作上，在 CSRankings 裡面點開每個學校名字就會展開該校所有 faculty 的 count 列表，大家可以把每個學校頭部 faculty 的水平和學校總體排名結合起來一起看而不只是看 institutional 總分。當然，之前就提過 faculty 數量少導致排名低也不完全是 bias。因為 faculty 少的學校的課程開設以及研究方向的多樣性必然就低，這也是一個需要重要考慮的 tradeoff。這一點在文理學院裡最為明顯。前面提到導致 LAC 的教學 default 重視理論、課程多樣性不夠的一部分原因是 lab 資源有限，而另一部分原因正是 faculty 數量少限制了選修課的覆蓋面。

接下來我想給對 research 感興趣的同學大概介紹一下每個學校的強勢領域。首先 Top 4 的 CMU、MIT、Stanford 和 UC Berkeley 就不用多說了，這四所學校在大部分主流方向都是最厲害的，基本不需要 audit specific subarea。對於除此之外的其他學校，AI 方向 [University of Washington](https://en.wikipedia.org/wiki/University_of_Washington) 是最好的，systems 方向最強的是 UIUC，而 theory 方向最好的則是 Princeton。但我們真的可以做這樣的排序嗎？這種 single-label 的描述當然是舒服的，因為它為讀者用最少的 cognitive cost 建立起來了一個 mental model，但實際上這是一個很不負責任的簡化。"在這個領域內某學校特別強"這句話的意思實際上更接近"這個學校在這個領域裡的 visibility 特別高 / historically 出名"，但絕不是"這個學校只在這個領域內強"，也不是"這個領域只有這一所強校"，更不是"排名比較一般的學校就不存在最頂尖的教授"。所以假如各位讀者有一個自己具體感興趣的方向，建議直接上 CSRankings 選 specific subarea filter 來看看這個領域內的生態究竟是什麼樣的，而不是只憑這種粗略的 label。

當然 CSRankings 也不絕對，它反映的是一個學校歷史上的 publication record，沒法體現一個 program 當前的 trajectory，更沒法體現出每個 faculty 在社區裡實際的影響力。比如最近新招進來的 rising star 潛力無限但無法在資料裡體現，已經退休的 senior faculty 反而可能還在 count，而一個圖靈獎得主可能整個職業生涯都沒發過太多論文。所以一個比較 practical 的補充辦法是去看一個學校裡 faculty 拿到的 peer-reviewed recognition。對於 early-career 的年輕教授可以看 [Sloan Research Fellowship](https://en.wikipedia.org/wiki/Sloan_Research_Fellowship)、[NSF CAREER Award](https://en.wikipedia.org/wiki/National_Science_Foundation_CAREER_Award) 這一類獎項，反映的是業內同行對這群人未來幾年潛力的判斷；對於 senior faculty 可以看 [ACM Fellow](https://en.wikipedia.org/wiki/ACM_Fellow)、[IEEE Fellow](https://en.wikipedia.org/wiki/IEEE_Fellow)、[NAE](https://en.wikipedia.org/wiki/National_Academy_of_Engineering) / [NAS](https://en.wikipedia.org/wiki/United_States_National_Academy_of_Sciences) 院士等 bar 更高的榮譽，這些反映的是同行對一個學者長期 sustained impact 的認可；除此之外，對於單篇 paper 而言的頂會 Best Paper 和 Test of Time Award 也很有 signal 價值，前者反映一項 single work 的 immediate impact，後者則反映一項工作經過時間檢驗依然 holds up 的長期價值。

這些榮譽往往會比任何排名都更能反映出一個學校的真實水平，但調研起來也會麻煩得多。好在隨著現在各類 AI 工具的普及，在具體操作上同學們其實不需要自己一個一個去翻系裡的網站，直接讓 AI agent（比如 Claude 或 ChatGPT 的 deep research 模式）幫你列出來就行，這種查找類的任務 AI 往往比人快得多也準得多。

但是在這裡我也希望各位同學能認識到，這些榮譽的選拔和任何排名一樣都不是完美的。在[〈關於選校〉]({{ '/guides/chinese/school-selection-TW/' | relative_url }})中我大概提了一下 [faculty hiring 的隨機性]({{ '/guides/chinese/school-selection-TW/#faculty-hiring-的隨機性' | relative_url }})，但其實這些榮譽選拔過程中的隨機性一點也不比 faculty hiring 少。所以我希望同學們在不唯排名論的同時也盡量做到不唯榮譽論。我在[〈關於選校〉]({{ '/guides/chinese/school-selection-TW/' | relative_url }})裡提到的["愛馬仕還是帆布袋"理論]({{ '/guides/chinese/school-selection-TW/#愛馬仕還是帆布袋' | relative_url }})在這裡同樣適用。因為榮譽應該被看作是 capacity 的間接 signal 之一，而不是 capacity 本身。我覺得在大學裡做 research 更多的是享受這個 problem-solving 和 knowledge discovery 的過程而不是一定要取得什麼具體的榮譽。

### Sweet spot framework

此外，對於想做 research 的同學來說，[〈關於選校〉]({{ '/guides/chinese/school-selection-TW/' | relative_url }})一文裡的 [ceiling × demand framework]({{ '/guides/chinese/school-selection-TW/#ceiling--demand-framework' | relative_url }}) 在這裡直接適用。比如 [UIC](https://en.wikipedia.org/wiki/University_of_Illinois_Chicago) 的資料探勘、[猶他大學](https://en.wikipedia.org/wiki/University_of_Utah)的圖形學這些 field-specific 頂尖的 mid-tier R1 就是 CS sweet spot 的典型樣例。這樣 sweet spot 的例子在 CS 裡還有很多；而且每個人的實力不同，因此 sweet spot 自然也就不同，所以在這裡就不一一列舉了。需要注意的是好學校裡 Sloan Research Fellowship 等頗有含金量的獎項的得主可能會多一些，但這並不意味著這些人在 mid-tier R1 就不存在，所以就像我在[〈關於選校〉]({{ '/guides/chinese/school-selection-TW/' | relative_url }})中提到的，只要去一個還不錯的學校一樣可以有很好的發展。

### National lab 與算力優勢

這裡還有一個值得一提的 mechanism 是國家實驗室帶來的算力優勢。[美國能源部](https://en.wikipedia.org/wiki/United_States_Department_of_Energy)旗下有多家國家實驗室，頭部的幾家都 host 了頂級的 supercomputing facility，有著遠超一般學術界的算力資源。地理上鄰近這些實驗室的學校自然就近水樓臺先得月，透過 joint appointment、collaborative project 等 channel 在合作研究時有結構性的優勢。這是一個和學校排名幾乎正交的維度。具體來講，[Lawrence Berkeley National Laboratory](https://en.wikipedia.org/wiki/Lawrence_Berkeley_National_Laboratory) 旗下的 [NERSC](https://en.wikipedia.org/wiki/National_Energy_Research_Scientific_Computing_Center) host 了 [Perlmutter](https://en.wikipedia.org/wiki/Perlmutter_(supercomputer)) 和即將 launch 的 Doudna 超算，UC Berkeley 就在山下；[Argonne National Laboratory](https://en.wikipedia.org/wiki/Argonne_National_Laboratory) host 了 [Aurora](https://en.wikipedia.org/wiki/Aurora_(supercomputer)) 這台全球排名第三的 supercomputer，附近有 [UChicago](https://en.wikipedia.org/wiki/University_of_Chicago)，UIC 和 [Northwestern](https://en.wikipedia.org/wiki/Northwestern_University) 等；全球排名第二的 [Frontier](https://en.wikipedia.org/wiki/Frontier_(supercomputer)) 超算位於 [Oak Ridge National Laboratory](https://en.wikipedia.org/wiki/Oak_Ridge_National_Laboratory)，附近有 UTK 和南方各校；全球排名第一的 [El Capitan](https://en.wikipedia.org/wiki/El_Capitan_(supercomputer)) 超算則位於 [Lawrence Livermore National Laboratory](https://en.wikipedia.org/wiki/Lawrence_Livermore_National_Laboratory)，附近有 UC system 各校和其他加州學校。除此之外還有 [SLAC](https://en.wikipedia.org/wiki/SLAC_National_Accelerator_Laboratory)（附近的 Stanford）、[Brookhaven](https://en.wikipedia.org/wiki/Brookhaven_National_Laboratory)（附近 NYC 一帶的 [Stony Brook](https://en.wikipedia.org/wiki/Stony_Brook_University)、[Columbia](https://en.wikipedia.org/wiki/Columbia_University)、[NYU](https://en.wikipedia.org/wiki/New_York_University) 等）以及其他很多例子。這種 partnership 在做 systems（尤其是 HPC）、AI for science、大規模 ML 等方向的研究時往往是 complete game-changer。所以對應方向的同學選校時除了看前面介紹的那些指標，也建議看一看學校附近有沒有這種 national lab。一般來說具備這種地緣優勢的 R1 都會至少有幾個和國家實驗室有合作的 faculty，而 partnership 深厚的學校（比如 UC Berkeley、UTK 這種）合作 faculty 數量則會多得多。

## CS Career Path

> 註：以下內容截至 2026 年 5 月。CS 求職市場變動很快，熱門方向輪轉、薪資水平浮動、入行門檻變化都是常態，這裡給的是一個大致的 landscape，目的是幫助讀者建立一個可靠的 mental model，但具體崗位的最新行情還請以最新資訊為準。

最後我想再聊一聊對於本科畢業想直接就業的同學們來說，比較常見的 CS career path 有哪些。說實話我覺得對於本科生來說專業對口的基本上就是 SWE 和 quant 這兩個。當然其他還有一些像是創業、product management 和 consulting 之類的，但我都沒太了解過，而且這些也都不是 CS specific 的，所以在這裡就不多做討論了。

我一直覺得不少公司的 SWE 就是一個筐，什麼都可以往裡裝。所以這個崗位實際上囊括的工作範圍遠比聽上去要大。根據公司業務和技術棧的不同，SWE 內部的生態非常多元，下面挑幾個比較有代表性的分支簡單聊聊。

### Product Engineer

首先最常見的是 Product Engineer，根據具體業務還會進一步分成 App、Web 和 Backend 幾類。他們工作的重心是實現 product manager 設計的業務邏輯，比如給某個 App 加一個新的 feature、把網頁載入速度從 800ms 壓到 400ms 以下，或者為高併發業務設計能撐住峰值千萬級 QPS 的後端架構。這一線更強調對業務的理解、對分散式系統的熟練度，以及在大型 monorepo 裡能高效迭代的工程能力。大廠裡 product 這條線的 headcount 是最大的，對應屆畢業生也最友好——Meta、Google、[Amazon](https://en.wikipedia.org/wiki/Amazon_(company)) 這些公司每年招的應屆 SWE 絕大多數都會先加入到 product 團隊裡。除了這些 [FAANG](https://en.wikipedia.org/wiki/Big_Tech) 傳統大廠之外，[Stripe](https://en.wikipedia.org/wiki/Stripe,_Inc.)、[Notion](https://en.wikipedia.org/wiki/Notion_(productivity_software))、[Figma](https://en.wikipedia.org/wiki/Figma)、[Cloudflare](https://en.wikipedia.org/wiki/Cloudflare) 這種正在高速擴張的大公司招的 SWE 主力也是 product engineer，這些公司體量比大廠小、單人能 own 的業務範圍反而更大，對工程獨立性的要求往往不低，近幾年也成了不少應屆生很傾向的選擇。

### Systems/Infrastructure Engineer

然後偏向 systems 的是 Systems/Infrastructure Engineer。這一類 SWE 的工作更接近之前提到的 systems research 的範疇，但和 researcher 相比關心的問題不太一樣：researcher 關心怎麼把一個 idea 寫成一篇 paper，而 infra engineer 關心怎麼把這個論文裡的 idea 真正落實到生產環境裡穩定跑起來。具體工作包括自研資料庫（比如 Google 的 Spanner、Meta 的 MyRocks）、分散式儲存、CI/CD 流水線、自研編譯器和工具鏈，甚至包括 kernel patch。這類崗位在 [Databricks](https://en.wikipedia.org/wiki/Databricks)、Snowflake 這種以底層基礎設施為核心業務的公司裡 headcount 佔比特別高，大廠裡也都有專門的 infra org。但這條線對 systems 底層理解的要求很高，所以對大部分本科生沒那麼友好。

### Machine Learning Engineer

最後是偏向 AI 的 Machine Learning Engineer（MLE）。這個崗位和 systems engineer 一樣，本質上還是工程師，他們的工作不是推導公式，而是怎麼把 researcher 訓練出的模型真正部署到生產當中。每天要做的事情包括處理海量訓練資料、寫訓練 pipeline、把模型在手機端做低功耗運行、保證大規模推理的低延遲、做 model serving 的擴縮容等等。具體落地上，OpenAI、Anthropic、Google deepmind 這種 frontier lab 的 MLE 更多是和 researcher 一起把模型訓練跑起來；而 Meta、Google 內部業務驅動的團隊的 MLE 則主要是把 ranking model、recommendation system 這類東西做落地調優。這個崗位不僅需要對常用的 AI 模型有理論上的理解，更要能熟練使用 PyTorch、CUDA 這些技術棧。過去兩三年隨著 GenAI 的爆發，這條線也成了 SWE 裡對本科生而言增長最快、薪水也最高的方向之一，但與此同時它對 candidate 的要求也很高。

### S&P 500 SWE

以上三類都是科技行業內部的 SWE 分支，但 SWE 這個崗位的 footprint 其實遠不止科技公司。[S&P 500](https://en.wikipedia.org/wiki/S%26P_500) 裡相當一部分公司雖然不是純科技公司，但內部都有規模可觀的 engineering 團隊，而且前面提到的 product、infra、MLE 三條支線在這些公司裡基本都齊全：比如 [Walmart](https://en.wikipedia.org/wiki/Walmart)、[Target](https://en.wikipedia.org/wiki/Target_Corporation) 內部的電商業務線主要對應 product engineering、[Visa](https://en.wikipedia.org/wiki/Visa_Inc.) 和 [Mastercard](https://en.wikipedia.org/wiki/Mastercard) 的支付系統是典型的大規模 infra 工程、而 [Disney](https://en.wikipedia.org/wiki/The_Walt_Disney_Company) 的串流媒體推薦系統和 [UnitedHealth](https://en.wikipedia.org/wiki/UnitedHealth_Group) 的 risk modeling 都越來越依賴 MLE。這些傳統行業裡的 SWE 崗位的特點是 compensation 比 FAANG 低一檔、工作節奏相對溫和、business 也更穩定，對想要 work-life balance 或者積累特定行業 domain knowledge 的同學是一個很不錯的選擇。

### 其他傳統行業 SWE

除了 S&P 500 這些巨頭之外，還有幾條傳統行業 SWE 業務線也很值得一提。其中會計與諮詢基本是規模最大的一塊。Big 4（[Deloitte](https://en.wikipedia.org/wiki/Deloitte)、[PwC](https://en.wikipedia.org/wiki/PricewaterhouseCoopers)、[EY](https://en.wikipedia.org/wiki/Ernst_%26_Young)、[KPMG](https://en.wikipedia.org/wiki/KPMG)）內部都有相當規模的 engineering org，主要做審計自動化、稅務軟體以及諮詢專案裡的 tech delivery；策略諮詢裡 [McKinsey](https://en.wikipedia.org/wiki/McKinsey_%26_Company)（McKinsey Digital）、[BCG](https://en.wikipedia.org/wiki/Boston_Consulting_Group)（BCG X）、[Bain](https://en.wikipedia.org/wiki/Bain_%26_Company)（Bain Vector）這幾年也都在大力擴張自己的 digital arm；而 IT 諮詢 / outsourcing 這邊的 [Accenture](https://en.wikipedia.org/wiki/Accenture)、[IBM Consulting](https://en.wikipedia.org/wiki/IBM_Consulting)、[Cognizant](https://en.wikipedia.org/wiki/Cognizant)、[Infosys](https://en.wikipedia.org/wiki/Infosys)、[TCS](https://en.wikipedia.org/wiki/Tata_Consultancy_Services) 等更是有數十萬人規模的 SWE pool。除此之外 biotech / hospital system（[Vertex](https://en.wikipedia.org/wiki/Vertex_Pharmaceuticals)、[Moderna](https://en.wikipedia.org/wiki/Moderna)、[Biogen](https://en.wikipedia.org/wiki/Biogen)、[Regeneron](https://en.wikipedia.org/wiki/Regeneron_Pharmaceuticals) 這些 biotech 加上 [Mass General Brigham](https://en.wikipedia.org/wiki/Mass_General_Brigham)、[Cleveland Clinic](https://en.wikipedia.org/wiki/Cleveland_Clinic) 這樣的大型醫院系統）也是一個體量很大的 domain-specific SWE cluster，主要做 clinical data pipeline、電子病歷、生信分析這一類工作。上面提到的這幾類 SWE 整體的 compensation 和 WLB 大致和 S&P 500 差不多，對想做 generalist 或者有生物 / 醫學背景的同學都是不錯的方向。

### 傳統金融業 SWE

傳統行業裡稍微特別一點的一條線是金融業 SWE，主要包括投行（[Goldman Sachs](https://en.wikipedia.org/wiki/Goldman_Sachs)、[Morgan Stanley](https://en.wikipedia.org/wiki/Morgan_Stanley)、[JP Morgan](https://en.wikipedia.org/wiki/JPMorgan_Chase) 等）和 asset management（[BlackRock](https://en.wikipedia.org/wiki/BlackRock)、[Vanguard](https://en.wikipedia.org/wiki/The_Vanguard_Group)、[Fidelity](https://en.wikipedia.org/wiki/Fidelity_Investments)、[State Street](https://en.wikipedia.org/wiki/State_Street_Corporation)、[Wellington](https://en.wikipedia.org/wiki/Wellington_Management_Company) 等）兩塊。兩邊內部的不少公司都有數千甚至上萬人規模的 engineering org，工作內容也相當類似——前面提到的 product / infra / MLE 三條支線在這裡一應俱全：面向客戶和內部用戶的 trading platform / 業務 portal 屬於 product engineering，自研的低延遲交易系統和 market data 系統是典型的 infra engineering，而 portfolio analytics、risk system、fraud detection、credit risk、algorithmic execution 這些則越來越依賴 MLE。金融業 SWE 整體的 compensation 介於大廠和傳統 S&P 500 之間，文化也比純科技公司更正式；投行的工作節奏會明顯比科技行業更緊、hours 也更長，asset management 則相對接近 S&P 500 的水平。這兩個行業對想接觸金融領域工程問題的同學都是一個不錯的選擇。

### Quant

其實傳統金融業裡一部分 SWE 崗位的工作內容其實已經很接近 quant 了，但對 candidate 的要求一般來說比 quant 要低一些。所以 quant 究竟是幹什麼的呢？在回答這個問題之前我覺得先要把 quant 分為兩類：一類是高頻做市商，另一類則是對沖基金。

做市商就是一個在市場裡提供流動性的角色，簡單理解的話就是"二道販子"，負責在市場上同時報一個買價（bid）和一個賣價（ask），從中賺取這個差價（bid-ask spread）。當然現在股票已經全面進行電子交易了，所以做市商都會在線上進行高頻做市。這條線上最有名的幾家公司包括 [Jane Street](https://en.wikipedia.org/wiki/Jane_Street_Capital)、[Citadel Securities](https://en.wikipedia.org/wiki/Citadel_Securities)、[Hudson River Trading](https://en.wikipedia.org/wiki/Hudson_River_Trading)、[Jump Trading](https://en.wikipedia.org/wiki/Jump_Trading)、[Optiver](https://en.wikipedia.org/wiki/Optiver) 等等。做市商策略的核心 challenge 是低延遲——很多策略的盈虧就取決於微秒甚至納秒級別的延遲差距，所以這類公司內部對 systems 工程能力的要求其實極高，相當一部分 quant developer 幹的事情和頂級 infra engineer 沒什麼本質區別，只是 stack 是為了 ultra-low-latency 專門定製的（比如 kernel bypass、FPGA 加速、熱路徑上手寫組合語言等等）。一般來說這類公司裡的崗位可以分成三類：quant trader 負責即時決策和策略調參，quant researcher 負責設計新策略和挖新的 signal，quant developer 則負責搭建和優化整個 trading infra。三類崗位的 compensation 都非常高，最頂尖幾家公司的應屆生 base salary 一般在 \\$200-300k 區間，加上 sign-on 和 bonus，total compensation 通常能到 \\$400k 以上。

不同於做市商那樣用自有資金做"二道販子"，對沖基金這條線的業務邏輯主要是幫客戶理財。從資金來源角度看這其實跟銀行理財差不多，只不過客戶群體更窄。他們的交易頻率相比做市商會慢很多，但策略空間也更大。最有名的幾家包括 [Citadel](https://en.wikipedia.org/wiki/Citadel_LLC)、[Two Sigma](https://en.wikipedia.org/wiki/Two_Sigma)、[D.E. Shaw](https://en.wikipedia.org/wiki/D._E._Shaw_%26_Co.)、[Renaissance Technologies](https://en.wikipedia.org/wiki/Renaissance_Technologies)、[Millennium](https://en.wikipedia.org/wiki/Millennium_Management,_LLC)、[Point72](https://en.wikipedia.org/wiki/Point72_Asset_Management) 等等，每家公司內部又會進一步分出不同的業務線，每個業務線都對應不同的策略思路和投資哲學。整體上他們的策略持倉週期可以從幾分鐘到幾個月不等，所以低延遲不像做市商那麼 critical，但對 statistical modeling、time-series analysis、machine learning 這些數學建模工具的要求會更高。

對 CS 本科生來說，對沖基金這條線上能觸及到的崗位會比做市商少一些。一方面，絕大部分基金採用主觀交易而不是 systematic trading，CS 專業對於前者基本沒有明顯優勢；另一方面，systematic fund 內部最 heavy 的崗位是 quant researcher，而這種崗位他們傾向於直接 hire 數學、統計、物理 PhD，應屆本科生想直接進去比較困難。但頂級 systematic fund 裡依然會有相當一部分面向 CS 本科生的 quantitative developer 崗位，最有代表性的是 Citadel 旗下的 GQS（Global Quantitative Strategies）。GQS 的 quantitative developer 主要負責給 quant researcher 搭建研究與回測平台、維護 production 上的 trading infra、以及做策略落地時所需要的各種工具鏈開發，本質上和頂級做市商裡的 quant developer 幹的事情非常接近，但區別主要在於 stack 服務的策略不同：對沖基金主要是中低頻交易，而做市商主要是高頻做市。Two Sigma 和 D.E. Shaw 有不少策略也都是 systematic 的，所以內部也都有類似定位的 quantitative developer pipeline。這類崗位在頂級 fund 裡的 compensation 基本和頂級做市商的 quant developer 持平。

近幾年另一個值得一提的趨勢是，無論是做市商還是對沖基金，對 ML 的依賴都在明顯加深——做市商主要用 ML 挖 short-horizon signal 和優化 execution，對沖基金則直接把 ML 當成系統化策略的核心引擎。從工程視角看，這其實和前面提到的大廠 MLE 在做的事情非常類似，只不過落地場景換成了 trading。

整體來說，無論是做市商還是對沖基金，進 quant 這條線的門檻都是 CS career path 裡最高的之一，基本和 frontier lab 持平。做市商的 trading 崗位更看重數理直覺和反應速度，所以非常偏愛有數學、物理或者演算法競賽背景的本科生；而 systematic fund 最核心、門檻最高的崗位是 quant researcher，所以更看重獨立做研究的能力，本科直接拿 offer 難度更大。因此這兩條線對應屆 CS 本科生最 accessible 的入口其實都是 quant developer，因為對純 trading 或 research 能力的要求相對低一些，但對工程能力的要求和頂級大廠 infra engineer 持平甚至更高，所以對 systems 方向很 hands-on 的同學反而是個不錯的目標。

## CS 產業分布

> 註：以下內容截至 2026 年 5 月。CS 產業變動很快，開 office、搬遷、裁員都是常態，這裡給的是一個大致的 landscape，目的是幫助讀者建立一個可靠的 mental model，但具體公司的具體情況還請以最新資訊為準。

剛剛聊完了幾條主流 career path，最後我想再換個視角，從地理上簡單看一下美國 CS 產業的 hub 分布。這一點經常容易被忽略，但實際上對實習機會和畢業 placement 都有不少影響。

### 大廠

FAANG 大廠的核心 hub 是**舊金山灣區**（**Bay Area**，包括 **SF** 市區以及 **Mountain View** / **Palo Alto** / **Cupertino** 一帶的 **South Bay**），Meta、Google、[Apple](https://en.wikipedia.org/wiki/Apple_Inc.)、Nvidia 的總部都在這裡；**Seattle** 都會區是第二大 hub，[Microsoft](https://en.wikipedia.org/wiki/Microsoft) 總部在湖東的 **Redmond**，Amazon 總部在 **Seattle** 市區；**NYC** 也有不少大廠的辦公室，主要做 fintech、廣告、媒體相關的 product。近幾年 **Austin** 也逐漸變成了一個新興的大廠集群——Apple 在那裡有 **Cupertino** 之外最大的園區，[Tesla](https://en.wikipedia.org/wiki/Tesla,_Inc.) 也因為稅收和政策原因把總部搬到了 **Austin**（[Oracle](https://en.wikipedia.org/wiki/Oracle_Corporation) 2020 年也曾把總部從 **Bay Area** 搬到 **Austin**，但 2024 年又把全球總部移到了 **Nashville**），Meta、Google 等也都在 **Austin** 開了規模可觀的 satellite office。

### 其他科技公司與 AI lab

除了大廠之外剩下的 tech firm 大概還分為兩類：一類是已經上市的成熟中型科技公司，比如 Snowflake、Cloudflare、[Datadog](https://en.wikipedia.org/wiki/Datadog)、[MongoDB](https://en.wikipedia.org/wiki/MongoDB_Inc.)、[Twilio](https://en.wikipedia.org/wiki/Twilio)、Figma 等，這一檔公司在 **SF** 之外的分布要比 FAANG 均勻得多——**NYC**（Datadog、MongoDB 等）、**Boston**（[HubSpot](https://en.wikipedia.org/wiki/HubSpot) 等）、**Austin**、**Chicago**（一些 enterprise SaaS）、**Bozeman MT**（Snowflake）都有不小的 footprint。另一類則是高速增長但還沒上市的 private firm，尤其是這兩年起來的 AI lab 和 AI infra 公司：OpenAI、Anthropic、Databricks、Stripe、Notion、[Vercel](https://en.wikipedia.org/wiki/Vercel) 等等，他們的總部幾乎清一色集中在 **SF** 市區。

### S&P 500

S&P 500 裡的傳統行業公司分布最廣，SWE 團隊基本跟著公司總部走，所以 hub 跨越了幾乎整個美國。Retail 行業裡的 Walmart 在 **Arkansas Bentonville**（Walmart Global Tech 這個 sub-org 在 **Bay Area** 的 **Sunnyvale** 也有規模可觀的 site），Target 在 **Minneapolis**（**Bay Area** 也有 tech hub），[Home Depot](https://en.wikipedia.org/wiki/The_Home_Depot) 在 **Atlanta**（**Austin** Technology Center 也是規模可觀的 tech site），[Costco](https://en.wikipedia.org/wiki/Costco) 在 **Seattle** 東邊的 **Issaquah**；healthcare 和 pharma 方面 UnitedHealth 在 **Minneapolis**、[CVS Health](https://en.wikipedia.org/wiki/CVS_Health) 在 **Rhode Island**、[Aetna](https://en.wikipedia.org/wiki/Aetna)（已被 CVS 收購）在 **Hartford**、[Pfizer](https://en.wikipedia.org/wiki/Pfizer) 在 **NYC**（R&D 重心在 **Cambridge MA** 和 **Groton CT**），[Merck](https://en.wikipedia.org/wiki/Merck_%26_Co.) 和 [J&J](https://en.wikipedia.org/wiki/Johnson_%26_Johnson) 都在 **New Jersey**；金融服務公司分布更廣，Visa 在 **Peninsula** 的 **Foster City**（**Austin** 也有大型 tech office），Mastercard 在 **NYC** 北郊的 **Purchase**，[Bank of America](https://en.wikipedia.org/wiki/Bank_of_America) 在 **Charlotte**（**NYC**、**Dallas**、**Chicago** 也都有大型 engineering team），[Capital One](https://en.wikipedia.org/wiki/Capital_One) 在 **DC** 郊外的 **McLean**（**NYC**、**SF**、**Plano TX**、**Richmond** 也都有規模可觀的 tech office），[American Express](https://en.wikipedia.org/wiki/American_Express) 在 **NYC**（**Phoenix** 和 **Salt Lake City** 是另外兩個大型 tech hub）；汽車方面 [Ford](https://en.wikipedia.org/wiki/Ford_Motor_Company) 和 [GM](https://en.wikipedia.org/wiki/General_Motors) 都在 **Detroit** 周邊；aerospace / defense 方面 [Boeing](https://en.wikipedia.org/wiki/Boeing) 把總部從 **Chicago** 搬到了 **Arlington** 但 Commercial Airplanes 主力依然在 **Seattle** 一帶，[Lockheed Martin](https://en.wikipedia.org/wiki/Lockheed_Martin) 總部在 **Bethesda**（**Fort Worth**、**Sunnyvale**、**Denver**、**Orlando** 都有大型 site），[Northrop Grumman](https://en.wikipedia.org/wiki/Northrop_Grumman) 在 **Falls Church**；媒體方面 Disney 在**洛杉磯 Burbank**（**Bay Area** 和 **Seattle** 也是 Disney Streaming 的 tech site），[Comcast](https://en.wikipedia.org/wiki/Comcast) 在 **Philadelphia**。這一檔崗位最大的特點就是分布廣——一方面公司總部本身就遍布全美各地，另一方面這些公司大多還在 **Salt Lake City**、**Phoenix**、**Plano**、**Columbus**、**Tampa** 這種二線城市開了規模可觀的 tech / delivery center，所以如果畢業後不想留在 **Bay Area** / **Seattle** / **NYC** 這幾個核心 tech hub 而希望去美國其他城市發展，S&P 500 這一檔基本是覆蓋面最廣、最容易找到 SWE 崗位的方向。另外值得一提的是這些公司近年也都在大力升級自己的 engineering org，像是 Walmart Global Tech、Capital One Tech 這種 sub-org 在內部基本已經按現代科技公司的標準來運營，對求職者來說體驗和大廠 SWE 不會差太多。

### 其他傳統行業

會計與諮詢這一類公司在地理上的特點是總部多數集中在 **NYC** 或 **Boston**，但 office network 覆蓋全美幾乎每一個 metro，因為諮詢業務本身就以貼近客戶為主。Big 4 美國總部清一色在 **NYC**，但他們在 **Chicago**、**DC**、**Atlanta**、**Dallas**、**LA**、**SF**、**Houston**、**Boston** 這些大都市基本都有數千人規模的 office；策略諮詢裡 McKinsey 美國總部在 **NYC**，BCG 和 Bain 這兩家從 **Boston** 起家的公司則繼續把總部留在 **Boston**，三家在主要 metro 也都各有 office。IT 諮詢和 outsourcing 這邊 Accenture 美國主力在 **Chicago**，但 office network 在全美極度分散；IBM Consulting 跟著 IBM 總部在 **NYC** 北郊的 **Armonk**（**Raleigh-Durham** 是 IBM 最大的非 HQ campus，**Austin** 和 **Atlanta** 也都是大型 site）；Cognizant 總部在 **NJ** 的 **Teaneck**（**Dallas**、**Phoenix**、**Tampa** 是幾個大型 delivery center）；Infosys 和 TCS 這兩家公司則把美國主力 office 設在 **Indianapolis**（Infosys 在那裡有一個非常大的 tech / training 園區）、**NJ**、**Phoenix**、**Raleigh-Durham** 一帶。

Biotech 這條線高度集中在 **Boston** / **Cambridge** 一帶——Moderna 和 Biogen 總部都在 **Kendall Square**，Vertex 則在 Boston **Seaport**，Regeneron 則在 **NYC** 北郊的 **Tarrytown**。Hospital system 則恰好相反——美國頂級醫院系統其實分布得相當散，幾乎每個 metro 都有自己的核心 medical center，比如 Mass General Brigham 在 **Boston**、Cleveland Clinic 在 **Cleveland**、[Mayo Clinic](https://en.wikipedia.org/wiki/Mayo_Clinic) 在 **Minnesota** 的 **Rochester**、[Johns Hopkins Medicine](https://en.wikipedia.org/wiki/Johns_Hopkins_Medicine) 在 **Baltimore**、[NYU Langone](https://en.wikipedia.org/wiki/NYU_Langone_Health) 在 **NYC**、[Kaiser Permanente](https://en.wikipedia.org/wiki/Kaiser_Permanente) 在 **Bay Area**、[UPMC](https://en.wikipedia.org/wiki/University_of_Pittsburgh_Medical_Center) 在 **Pittsburgh** 等等，對應的 health IT engineering team 也自然跟著分散在全美各地。

### 傳統金融業

投行的總部幾乎清一色在 **NYC 曼哈頓**——Goldman Sachs、Morgan Stanley、JP Morgan、[Citi](https://en.wikipedia.org/wiki/Citigroup) 也就是華爾街的代表——但這幾家的 engineering team 實際的地理分布要廣得多。Goldman Sachs 在 **Salt Lake City** 和 **Dallas** 都有美國僅次於 **NYC** 的大型 site，engineering team 佔了相當比例，其中 **Dallas** 近幾年還在大力擴張新園區；JP Morgan 的 tech 重心其實分布在 **Columbus OH**、**Plano TX**、**Wilmington DE** 等幾個非 **NYC** 的 hub；Citi 在 **Tampa** 和 **Irving TX** 都有大型 tech site；Morgan Stanley 則在 **Salt Lake City** 和 **Westchester NY** 都有規模可觀的 office。Asset management 這邊 BlackRock 總部在 **NYC**（**Atlanta** 是 NYC 之外最重要的 engineering hub，**Princeton NJ**、**Wilmington DE**、**SF** 也都有大型 office），Vanguard 總部在 **Philadelphia** 西郊的 **Valley Forge** / **Malvern**（**Charlotte** 和 **Dallas** 也都有大型 office），Fidelity、State Street、Wellington 幾家總部都在 **Boston**，其中 Fidelity 在 **Smithfield RI**、**Salt Lake City**、**Raleigh-Durham**、**Westlake TX** 都有大型 tech site。綜合 biotech 和 asset management 這兩條線，**Boston** 其實是除 **NYC** / **Bay Area** 之外少有的能涵蓋多條 career path 的產業 hub；而 **Salt Lake City** 因為同時承載著 Goldman、Morgan Stanley、Fidelity、American Express 這些公司的大型 tech site，加上 [Adobe](https://en.wikipedia.org/wiki/Adobe_Inc.) 在 **Lehi** 的園區（也就是俗稱的 Silicon Slopes），近幾年也已經發展成一個相當成熟的二線 tech hub。

### Quant

Quant 這條線上的兩類公司分布略有差異。做市商方面，**Chicago** 是衍生品做市商的傳統重鎮，Jump Trading、[DRW](https://en.wikipedia.org/wiki/DRW_Trading_Group) 等的總部都在這裡；**NYC** 則是 Jane Street、Hudson River Trading、[Virtu](https://en.wikipedia.org/wiki/Virtu_Financial) 這些 ETF / 期權 / 股票做市商的所在地；**Houston** 是 commodity 和能源交易的中心，Citadel、DRW 等大型 trading firm 都在那裡設有規模可觀的 commodity / 能源 desk，純能源 trading 公司比如 [Vitol](https://en.wikipedia.org/wiki/Vitol)、[Mercuria](https://en.wikipedia.org/wiki/Mercuria_Energy_Group)、[Trafigura](https://en.wikipedia.org/wiki/Trafigura) 也都把美國主力 office 設在 **Houston**；**Miami** 則是近幾年新興的 quant 聚集地，Citadel Securities 在 2022 年把總部從 **Chicago** 搬到了這裡（**芝加哥**那邊依舊保留有規模可觀的 office）。對沖基金主要集中在 **NYC** 和隔壁**康州**，Two Sigma、D.E. Shaw、Millennium、Point72 總部都在這裡，其中 Point72 在**芝加哥**也有 office；近幾年 Citadel 旗下的對沖基金主體把總部搬到了 **Miami**，Millennium、Point72、[Schonfeld](https://en.wikipedia.org/wiki/Schonfeld_Strategic_Advisors)、[Balyasny](https://en.wikipedia.org/wiki/Balyasny_Asset_Management)、[ExodusPoint](https://en.wikipedia.org/wiki/ExodusPoint_Capital_Management)、[D1 Capital](https://en.wikipedia.org/wiki/D1_Capital_Partners) 等也都陸續在 **Miami** 或附近的 **West Palm Beach** 開了規模可觀的 office，加上 **Florida** 沒有州個人所得稅，這一帶的 quant footprint 還在持續擴張。

### 產業集群與選校的聯繫

上面梳理的這些產業集群其實和本科選校之間有一層非常直接的關係——CS 的產業分布是高度地理化的，學校所在地的產業集群往往會對找工作有特別大的幫助。**加州**的學校和**矽谷**的關係最緊密，FAANG、中廠、**SF** 的 unicorn 對這些學校的招聘都非常 aggressive；UW 憑藉自身過硬的 CS program 以及和 Microsoft、Amazon 同處 **Seattle** 的地理優勢，在 **PNW** 一帶有幾乎壟斷地位的招聘 pipeline；UIUC 離 **Chicago** 比較近，本身又是 systems 重鎮，所以是 Chicago trading firm 最大的 feeder 之一；UChicago 因為本身就在 **Chicago** 而且有很強的數學系，所以也特別受 Chicago trading firm 的青睞；[UT Austin](https://en.wikipedia.org/wiki/University_of_Texas_at_Austin) 本身就在 **Austin**，加上 CS program 也很強，所以是 **Austin** 大廠集群（Apple、Tesla、Meta、Google 等）最直接的本科 pipeline；Georgia Tech 在 **Atlanta**，CS program 本身就是 top tier，對 **Atlanta** 幾家 S&P 500 巨頭（Home Depot、[Delta](https://en.wikipedia.org/wiki/Delta_Air_Lines)、[Coca-Cola](https://en.wikipedia.org/wiki/The_Coca-Cola_Company)、[UPS](https://en.wikipedia.org/wiki/United_Parcel_Service) 等）以及 FAANG 都有很強的 pipeline；[Rice](https://en.wikipedia.org/wiki/Rice_University) 因為本身就在 **Houston**，是前面提到的 **Houston** 能源 trading 圈最自然的本科 feeder；**NYC** 區域內的 Columbia、NYU 和 Princeton 則天然貼近華爾街，往 NYC trading firm 和對沖基金的 pipeline 就更不用說了。但其實這些被列舉出來的案例還只是冰山一角。

除此之外還有一類比較容易被忽視的 alignment 是很多 S&P 500 巨頭在招聘員工（包括 SWE）時其實非常 favor 總部附近的州立大學，所以一些緊鄰 S&P 500 巨頭總部的州立學校往往就是這些公司最主要的本科 pipeline——比如 [University of Arkansas](https://en.wikipedia.org/wiki/University_of_Arkansas) 之於 Walmart、[University of Minnesota](https://en.wikipedia.org/wiki/University_of_Minnesota) 之於 Target / UnitedHealth / [3M](https://en.wikipedia.org/wiki/3M)、[Michigan](https://en.wikipedia.org/wiki/University_of_Michigan) / [Michigan State](https://en.wikipedia.org/wiki/Michigan_State_University) 之於 Ford / GM、NC State / [UNC](https://en.wikipedia.org/wiki/University_of_North_Carolina_at_Chapel_Hill) 之於 Bank of America、[UMD](https://en.wikipedia.org/wiki/University_of_Maryland,_College_Park) / [Virginia Tech](https://en.wikipedia.org/wiki/Virginia_Tech) / [UVA](https://en.wikipedia.org/wiki/University_of_Virginia) 之於 **DC** 一帶的 defense（Lockheed、Northrop）和 Capital One、[Purdue](https://en.wikipedia.org/wiki/Purdue_University) 之於 **Indianapolis** 的 [Eli Lilly](https://en.wikipedia.org/wiki/Eli_Lilly_and_Company)、[Arizona State](https://en.wikipedia.org/wiki/Arizona_State_University) 之於 Intel 在 **Chandler** 的園區、University of Utah 之於 Adobe 等等。這裡還有太多太多其他的例子就不一一贅述了。

所以對於想本科畢業直接工作的同學而言，以就業為導向的選校真正值得關注的是上面這種學校所在地和產業 hub 的 alignment，而絕不是 US News 或 CSRankings 上前後差幾個名次這種 superficial 的因素。
