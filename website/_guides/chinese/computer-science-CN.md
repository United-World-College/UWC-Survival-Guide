---
title: "关于 Computer Science"
category: "UWC 之后的日子"
description: "从内部分支到职业路径，重新理解 CS 这个学科。"
order: 2
author_id: "william-huang"
original_language: "zh-CN"
guide_id: "computer-science"
language_code: "zh-CN"
language_name: "简体中文"
language_folder: "chinese"
language_sort: 2
published: 2026-05-10
updated: 2026-05-10
---


这是专业篇的第一篇文章，这个系列的初衷是希望通过科普的形式向大家介绍不同学科在本科阶段作为一个专业究竟是什么样的，有哪些细分领域以及哪些常见的 career path。第一篇我想先讲一讲 CS，带着大家从大学的视角来看我对这个学科的理解究竟是什么样的，和我高中时候的认识有什么不同。

我最开始对 CS 的兴趣是小时候玩机器人的时候培养起来的，那时候会写一些简单的代码控制机器人完成一些 deterministic 的任务，我记得最开始就是乐高机器人的那种；后来我参加过一些算法竞赛，学习了一些 competitive programming 的技巧。接着在高中的时候又做过一两个 AI 相关的小项目，这大概就是我上大学以前对 CS 这个学科的 mental model。但是上了大学以后我发现这个 mental model 立刻就 fall apart 了。现在回想起来那时候接触的这些东西真的只是一些皮毛而已，CS 作为一个学科还是有很多不同的领域和值得研究的问题的。但这正是这个学科的最让我钦佩的地方所在：它不像一些学科高高在上拒人于千里之外；恰恰相反，CS 通过自己不同层级的 abstraction 可以让不同知识背景的人都参与其中，感受到它的魅力。比方说我相信本文的大部分读者不一定懂得大模型的原理，但每天都在 benefit from it。然后对于稍微 advanced 一点的人来说可以 dive deeper，比如使用 coding agent 来写代码做项目，或者是调用一个 LLM 的 API 来完成一些任务。接着有更多知识储备的人可以在大模型这条线上继续深挖，比方说对特定任务做微调，甚至是预训练，开发相关算法，研究相关数学理论等等。对于每个人来说都可以在大模型这个领域内有自己的一席之地。但其实大模型这条线只是目前比较 popular 的 AI 方向的一个子领域而已，除此之外这门学科还有很多其他分支和领域，比如系统、理论等。这也就是为什么 CS 同时具有 vertical accessibility 和 horizontal heterogeneity。

说实话，CS 这门学科之所以具有 horizontal heterogeneity 是因为它本身就是数学、ECE、物理、语言学、认知科学等等很多学科高度耦合的产物。但也正因为如此，它内部不同的细分领域之间的界限往往是模糊的。对于具体怎么分类，不同的视角会有不同的分类方法，但不同方法之间差距不会太大。在这里我会参考 [CSRankings](https://csrankings.org/#/index?all&us) 这个网站上面的分类方法，从做 research 的角度来进行分析。

## 关于 CSRankings

在正式开始之前我想先简单介绍一下 CSRankings。这个网站在 CS 圈子里被公认是衡量学校科研实力的一个不错参考，它的排名是完全按照每个学校的 faculty 在每个领域的顶会里面发表文章的数量来进行加权计算的。这个计算方法相对公平，但也会有对应的问题。首先是它没法区分 groundbreaking work 和 incremental work（这两种在它的统计里都算是一篇文章，也就是 publication += 1，但实际影响力可能差了好几个数量级）；其次，它统计的是 conference 而不是 journal（顺便提一下，CS 的 convention 是把文章优先发表在会议而不是期刊，因为 CS 技术迭代太快，期刊审稿周期往往是会议的几倍，所以完全没法跟上），但这种统计方式对个别偏好 journal 的教授和子领域（比如 biocomputing）来说就是一个巨大的 disadvantage；此外还有一点就是 faculty 数量多的学校天然占优势，因为假设两个学校的教授的平均水平相同，那教授多的学校自然数值就会更高。但这一点也不完全是 bias，因为 faculty 多确实意味着 ecosystem 更厚。对于这些具体的问题我会留到之后的选校部分再慢慢展开，这里只是先请读者注意一下 CSRankings 并不是完美的排名，但它对了解每个学校的实力还是有重要参考价值的，而且它本身也是一个不错的领域划分指南。

好了现在言归正传。在 CSRankings 上 CS 这个学科大致被分成了四个大类：AI、Systems、Theory，以及一些 Interdisciplinary 的领域。虽说每个领域是相对自成一体的，对于每个领域甚至是内部的子领域的细分方向都会有各自的 community，但我一直觉得这四个 cluster 之间有一个逻辑上的附属关系：Theory 是最 foundational 的部分，提供 algorithm 和 computation 本身的数学基础；Systems 则是在 Theory 之上建立起了实际能运行的硬件和软件 infrastructure；AI 又在 Systems 之上延伸出能从数据中学习的应用；Interdisciplinary 则是 CS 和其他学科（生物、经济、艺术等）的交叉，一般来说会更加偏向应用一些。当然这些也都不是绝对的，像是 AI 这个领域里面其实也存在着大量的理论研究方向，比如 learning theory 之类的。下面我会按照刚刚提出的这个逻辑顺序依次介绍。

## Theory：CS 的数学基础

Theory 这个领域大致在做的事情是研究 computation 本身的数学性质，也就是什么问题能算、什么问题算不出来、能算的问题需要多少 resource、怎么 prove 一个 algorithm 是 optimal 的。这些都是 CS 这个学科的基石，为谈论 computation 提供了具体的语言和工具。而在 CSRankings 上 theory 又被进一步分成三个子方向：Algorithms & Complexity、Cryptography 以及 Logic & Verification。

### Algorithms & Complexity

Algorithms & Complexity 是 theory 里最经典的方向。我记得原来打算法竞赛的时候做每道题之前最重要一件事就是先看数据规模和题目的 constraint 来挑选合适的算法，这样才能保证在题目规定的时间复杂度以内解决问题。对于 research 而言这个 spirit 是一样的，只不过要解决的问题会复杂很多：algorithm 研究的是怎么设计更快的算法解决具体问题，比如图算法、近似算法、在线算法、随机算法这些；complexity 则是反过来，研究的是某一类问题至少需要多少 resource（时间、空间、随机性等等）才能被解决，给算法设计画一条理论上的下界。两条线一个在往下推上界、一个在往上推下界，最终目标是把它们对齐。比如基于比较的排序的下界已经被证明是 $\Omega(n \log n)$，而 [merge sort](https://en.wikipedia.org/wiki/Merge_sort)、[heap sort](https://en.wikipedia.org/wiki/Heapsort) 这些算法刚好都打到这个下界，那么排序在比较模型下就算是有定论了。但很多更难的问题，比如[矩阵乘法](https://en.wikipedia.org/wiki/Matrix_multiplication_algorithm)、[全源最短路径](https://en.wikipedia.org/wiki/Shortest_path_problem)，它们的上下界之间到现在还有不小的 gap，这就是 algorithm 和 complexity 这个领域一直在研究的东西。著名的 [P vs NP 问题](https://en.wikipedia.org/wiki/P_versus_NP_problem)就属于 complexity 的范畴，而这道题悬而未决已经五十多年，被 [Clay 数学研究所](https://en.wikipedia.org/wiki/Clay_Mathematics_Institute)列为七个 [Millennium Prize Problems](https://en.wikipedia.org/wiki/Millennium_Prize_Problems) 之一。

### Cryptography

Cryptography 表面上像是 algorithm 的一个应用，但其实它有自己一整套独立的理论框架。它研究的是怎么在有对手存在的环境下保证信息的机密性、完整性和真实性。这个方向特殊的地方在于 security 的定义都是建立在某个 complexity 假设之上的，比如 [RSA](https://en.wikipedia.org/wiki/RSA_cryptosystem) 的安全性建立在大整数分解很难这一假设之上。所以 cryptography 和 complexity 是天然纠缠在一起的：你必须先有一个 hardness assumption，才能在它之上搭建 crypto scheme。近几年这个领域比较火的方向有 [post-quantum cryptography](https://en.wikipedia.org/wiki/Post-quantum_cryptography)（担心未来的量子计算机会破掉现在主流的 crypto，所以提前设计能抵抗量子攻击的方案）、[zero-knowledge proof](https://en.wikipedia.org/wiki/Zero-knowledge_proof)（让一方在不泄露任何额外信息的前提下证明自己知道某个秘密，是很多 blockchain 系统的底层），以及 [multi-party computation](https://en.wikipedia.org/wiki/Secure_multi-party_computation) 等等。

### Logic & Verification

Logic & Verification 这条线相对小众一些，但解决的问题非常实在：怎么用 formal method 在数学层面证明一段程序、或者一个系统是正确的？比如一个 OS kernel、一个编译器、一个分布式协议，怎么保证它在所有输入下都不会 crash、不会泄露数据、不会出现 race condition？这就是 verification 要回答的问题。这个方向和 PL（programming languages）社区有很深的交集，因为很多 verification 工具本身就建立在类型系统、operational semantics 这些 PL 概念之上。这个领域比较有名的成果之一是 [seL4](https://en.wikipedia.org/wiki/SeL4)，一个被完整形式化验证过的 microkernel，能在数学上证明它的实现满足一份规约，所以被广泛用在军事、航天这些高安全场景里。

这一段对没接触过 verification 的读者来说可能有点抽象，可以拿算法竞赛打个比方。在算法竞赛、日常软件开发这些场景里，验证一段代码正不正确，靠的基本都是写大量测试用例去跑一遍，而不是去做 formal verification。所谓测试用例其实很好理解，比方说我手上有一个函数 $f(x) = x^2$，那输入 $2$ 就应该输出 $4$，输入 $3$ 就应该输出 $9$，以此类推。所以只要写大量测试用例来检验一个输入是否能得到对应的输出就可以了，成本相对 formal verification 来说很低。因为 testing 本质上只检查有限 specific input 是否得到正确 output，而不是像 formal verification 那样在数学上证明对所有可能的 input 程序都满足要求。但现实里的问题往往要复杂很多的，总会有测试用例没覆盖到的 corner case；对大部分软件开发来说这些遗漏其实无伤大雅，我们每天在用的 Chrome 这类产品里其实就存在着大量已知和未知的 bug，做这种产品的核心逻辑是快速迭代而不是万无一失。这是一种 tradeoff，用户可以忍一忍小毛病，下一版更新里修一下就行了，但放到航空航天、加密货币这些场景里，一个没考虑到的 corner case 可能就直接出人命或者亏掉一大笔钱，这种时候才值得花成倍的成本去做 formal verification。

芯片设计其实也是同一个道理。一颗芯片一旦流片就没法再打补丁了，做出来的几百万颗里只要有一个 corner case 被触发，可能就是整批召回的损失。一个经典的例子是 1994 年 Intel Pentium 的 [FDIV bug](https://en.wikipedia.org/wiki/Pentium_FDIV_bug)，因为浮点除法在某些极端输入下会算错，最后 Intel 花了将近五亿美元做召回。所以现代芯片在 tape out 之前一般都会用大量 formal method 去证明设计在所有合法输入下都满足规约。

Theory 整体对数学背景的要求很高，平时的工作大多发生在白板上而不是在 IDE 里，论文里也几乎全是证明而不是实验。所以如果不是发自内心喜欢推理和证明，在这个方向上孤军奋战会比较辛苦。但反过来说，theory 的成果寿命也是 CS 里最长的，一篇好的算法论文常常会被引用几十年，而 systems 和 AI 那边因为技术迭代实在太快，五年前的 SOTA 现在可能已经没人提了。

## Systems：让 computation 真正跑起来

Systems 这个 cluster 是 CS 里 footprint 最大的一块，它涵盖了几乎所有让 computation 真正能在硬件上跑起来所需要的基础设施，从最底层的芯片设计一路往上到 OS、网络、数据库、PL、SE 等等。systems 的研究风格和 theory 几乎完全相反：theory 是在纸上推公式证定理，systems 则非常 hands-on，几乎每篇论文都要做出一个真实的原型，再去测它的性能（延迟、吞吐量、功耗这些），用实测数据来支撑自己的结论。所以 systems 的论文经常会附带很大体量的代码。

继续从算法竞赛的角度来看的话，algorithm 做的就是如何降低时间复杂度，而 systems 当然也做让算法跑得更快这件事（也就是优化常数），但实际上它负责的事情要比这个杂得多，还包括怎么让多线程不出 race condition、机器挂掉怎么不丢数据、给上层什么样的接口才好用等等。这些大多都跟跑得快不快没什么关系，但都是 systems 这条线要负责的事情。

CSRankings 把 systems 拆成了大约十几个子方向，下面挑几个比较有代表性的简单聊聊。

### Computer Architecture

Computer Architecture 是 systems 里最贴近硬件的方向，研究的是 CPU、GPU、TPU 这些芯片内部应该怎么设计：cache 层级怎么组织、指令集是 RISC 还是 CISC、流水线怎么排、怎么处理分支预测和内存一致性等等。最近几年随着 [Moore's Law](https://en.wikipedia.org/wiki/Moore%27s_law) 慢慢失速，单纯堆晶体管的红利已经几乎没有了，所以 architecture 这条线的精力大量转向了为特定 workload（比如深度学习、图计算、cryptography）设计专门的加速器。[Google](https://en.wikipedia.org/wiki/Google) 的 [TPU](https://en.wikipedia.org/wiki/Tensor_Processing_Unit)、[NVIDIA](https://en.wikipedia.org/wiki/Nvidia) 的 [Tensor Core](https://en.wikipedia.org/wiki/Volta_(microarchitecture)) 都是这个趋势的产物。

### Operating Systems

Operating Systems 主要研究 OS kernel 应该怎么设计：怎么调度进程、怎么管理内存、怎么处理 I/O、怎么实现文件系统等等。这个领域近些年比较活跃的几个方向包括 unikernel（把应用和内核合并成一个单一目的的二进制来榨干性能）、verified microkernel（在 microkernel 拆分架构的基础上用 formal method 证明 kernel 核心实现的正确性，前面提到的 seL4 就是这条线上的代表），以及针对新硬件（比如 persistent memory、SmartNIC、disaggregated memory）做的 OS 改造。

### Networking

Networking 研究的是数据怎么在机器之间高效可靠地传输：从局域网内部的交换机设计，到跨数据中心的广域网，再到 Internet 上的路由协议，都属于这个领域。这两年这条线上很多研究都聚焦在数据中心网络上，因为云计算和大模型训练的需求，大家越来越关心怎么在数据中心内部做到极低延迟、不堵塞的通信。

### High-Performance Computing

High-Performance Computing 研究的是怎么把一份计算 scale 到上万个节点上高效跑完。这条线传统的 application 是解决科学问题，比如气候模拟、流体力学、第一性原理材料计算，这些都是国家级超算每天在做的事，背后的数学本质是 PDE 求解、大规模线性代数这一类 numerical methods 的工作。说实话，我感觉 HPC 更像是 systems 领域里集大成者于一身的方向，既和 architecture、network 这些方向高度交叉，又要特别关注应用数学里的 numerical stability 这些细节。另外值得一提的是，这两年大模型训练其实就直接建立在 HPC 几十年攒下来的基础设施上。GPU 集群、节点间高速互联、collective communication 这些本来就是 HPC 一直在做的事，整个大模型的训练栈基本就是在这上面发展出来的。

这里顺带提一下 numerical methods。它本质上是应用数学的一个分支，当放在 CS 里面讨论的时候它上面一层就是 scientific computing 这个更大的领域，scientific computing 除了 numerical methods 之外还包括 HPC 实现、计算物理/化学/生物这些领域科学，以及科学软件工程。因为 numerical methods 最常落地的平台就是 HPC，所以这两个 community 很多时候就是同一群人。其实 numerical methods 在做的事情很简单，那就是解决数学和计算机本质上的错位。这个错位主要有两个不同的来源。一个是连续和离散之间的差异：数学里很多对象本质上是连续的，比如导数、积分、PDE 的解、矩阵的特征值，但计算机只能处理离散、有限步的运算，所以导数得变成差分、积分得变成求和、PDE 得变成网格上的代数方程、特征值得靠迭代去逼近。另一个错位是 floating point 本身：计算机用浮点数近似实数，每一步都会丢一点 roundoff，规模一大就一路累积下去导致最后的计算结果可能就不能用了。Numerical methods 这个领域做的事就是要解决这两个问题，让算法既能保证收敛性、效率上也不至于太离谱。

到了大模型时代，在训练模型的时候连续和离散这一层其实基本不影响，因为训练本身已经是离散的矩阵乘法，没有什么需要做离散化的连续对象，但 floating point 这一层是真正的核心问题。大模型训练本质上就是海量浮点运算的累加，numerical stability 一旦没处理好，loss 就会突然 spike、模型直接训崩，动辄上千万美元的损失。这也是为什么 mixed precision（用 FP16 / BF16 / FP8 这些低精度格式提性能，但 FP16 自己就会带来 stability 问题）、loss scaling（用来补 FP16 的 gradient underflow，BF16 因为指数位和 FP32 一样宽通常用不上）、以及更精细的 scaling 策略这些 numerical-systems 交叉方向会是大模型训练的重头戏。

### Database

Database 研究的是怎么存、怎么索引、怎么查询大量数据。一个现代的数据库系统要解决的问题非常多：怎么在保证 [ACID](https://en.wikipedia.org/wiki/ACID) 的前提下做并发事务、怎么把查询分发到多台机器上、怎么优化 SQL 查询计划、怎么处理流式数据等等。这两年比较火的方向有内存数据库、云原生数据库（像 [Snowflake](https://en.wikipedia.org/wiki/Snowflake_Inc.)、[BigQuery](https://en.wikipedia.org/wiki/BigQuery) 这种），以及专门为大模型 retrieval 设计的向量数据库。

### Programming Languages

Programming Languages 研究的是编程语言本身：语言怎么设计、类型系统怎么搭、编译器怎么把高级代码翻译成机器码。不同语言其实代表着不同的设计 tradeoff，比如算法竞赛和高频交易常用的 C++ 给了用户完全的内存控制，速度很快但很容易 use-after-free、buffer overflow；Java、Python 这些用 garbage collector 接管内存，安全但有运行开销；Rust 这几年很火，靠 ownership 和 borrow checker 在编译期就把内存安全检查掉了，让用户既不用 GC 又能避开 C++ 那些最折磨人的错误。PL 这个领域和上面提到的 formal verification 有很深的交集，所以两边的社区有不少交流。

### Security

Security 这个子方向横跨的层次很广，从底层的硬件安全（比如 [Spectre](https://en.wikipedia.org/wiki/Spectre_(security_vulnerability))、[Meltdown](https://en.wikipedia.org/wiki/Meltdown_(security_vulnerability)) 这种侧信道攻击）到操作系统安全、网络安全，再到应用层的 web security 和 ML security，几乎每一层都有自己的攻击模型和防御机制。

### Software Engineering

Software Engineering 研究的是大规模代码库应该怎么组织、怎么测试、怎么维护。这个领域因为 AI 的兴起也变得非常活跃，比如程序合成、自动修 bug、自动写测试用例都是当下挺热的话题。需要说明的是，作为学术研究的 Software Engineering 和大厂里我们常说的 SWE（软件工程师）这个职业其实关系不大，只是名字一样而已。而 SWE 究竟是什么则会放在之后 career path 的部分详谈。

Systems 研究的问题大多来自真实的工程痛点，所以这个领域的学术界和工业界关系特别紧密。当然这也不是绝对的，像是刚才提到的 software engineering 就是一个反例：它作为 research topic 所关心的大规模代码库应该怎么组织、code review 怎么 scale、CI/CD pipeline 怎么设计这些问题，对于 Google 等大厂而言，因为自身 codebase 体量极大，早就 accumulate 了远超学术界的一手经验，相关 best practice 也往往是工业界先开发出来的。学术界里 software engineering researcher 的独特 contribution 是把这些 industry pattern 系统化，但最原始的 problem-solving frontier 确实往往都在工业界。

Systems 对人的要求和 theory 方向恰恰相反：它整体对工程能力的要求很高，平时的工作大多发生在终端和 profiler 里而不是在白板上，论文里也几乎全是 benchmark 和实测数据而不是数学证明。所以如果没有真的享受写代码、和真实硬件死磕的过程，这个方向会显得比较枯燥乏味。但从另一个角度来说，systems 的成果落地速度也是 CS 里最快的之一，一篇有分量的 paper 几年之内就有可能被工业界吸收成为标准实践，在博士期间就有可能看到自己亲手搭出来的系统真的被部署。

## AI：让计算机从感知到决策

AI 是 CS 里这几年发展最快、关注度最高的方向，几乎不用过多介绍。但 AI 内部其实也分了很多不同的子方向，下面简单展开一下。

CSRankings 把 AI 大致分成 AI（general）、Computer Vision、Machine Learning & Data Mining、Natural Language Processing、Web & Information Retrieval 这几个方向。但说实话，自从 [transformer](https://en.wikipedia.org/wiki/Transformer_(deep_learning)) 在 2017 年横空出世、之后又催生出 GenAI 这一波浪潮以来，这些子方向之间的界限已经越来越模糊。以前 vision 和 NLP 是两个相对独立的社区，现在大家都用同一套 backbone（transformer）和同一套范式（pretrain + finetune），多模态模型也开始一统天下。所以下面我会按照现在实际的研究 landscape 来讲，而不严格遵循 CSRankings 的分类。

### Foundation Model

Foundation Model 是这两年最热的方向。它的核心问题是怎么训练一个能在很多任务上泛化的模型，具体研究的子问题包括架构设计（attention 机制怎么改、怎么处理长上下文）、训练（pretraining 的数据配比、scaling law、RLHF 这些）、推理（怎么加速、怎么量化、怎么做 speculative decoding）以及评测（怎么设计真正能衡量模型能力的 benchmark）等等。这个方向非常依赖算力，很多最前沿工作只能在 industry lab（[OpenAI](https://en.wikipedia.org/wiki/OpenAI)、[Anthropic](https://en.wikipedia.org/wiki/Anthropic)、[Google DeepMind](https://en.wikipedia.org/wiki/Google_DeepMind) 等）里做，因为学术界很难拥有训练一个前沿模型所需要的那种规模的 GPU 集群。

### Computer Vision

Computer Vision 研究模型怎么理解图像和视频，具体任务包括分类、检测、分割、生成等等。在大模型时代之前，CV 是一个相对自洽的方向，有自己的 backbone（[ResNet](https://en.wikipedia.org/wiki/Residual_neural_network)、[ViT](https://en.wikipedia.org/wiki/Vision_transformer) 这些）和自己的任务集；但现在 vision 越来越多地被合并到多模态模型里去了。生成这条线目前也很活跃，[diffusion model](https://en.wikipedia.org/wiki/Diffusion_model)、视频生成都是当下的热点。

### Natural Language Processing

Natural Language Processing 研究模型怎么理解和生成自然语言。这个领域基本已经被 LLM 重塑了。以前的 NLP 任务（翻译、摘要、问答这些）现在都成了 LLM 的下游应用，所以 NLP 的研究重心也很大程度上转移到了 LLM 本身的能力和对齐上。

### Reinforcement Learning

Reinforcement Learning 研究的是 agent 怎么通过和环境交互学到一个最优策略。RL 在过去十年走过一段挺有意思的路：曾经它最有名的应用是下棋打游戏（[AlphaGo](https://en.wikipedia.org/wiki/AlphaGo)、[AlphaStar](https://en.wikipedia.org/wiki/AlphaStar_(software))），后来一度被认为不太实用；但近两年 [RLHF](https://en.wikipedia.org/wiki/Reinforcement_learning_from_human_feedback) 让它在 LLM 训练里成了不可或缺的一环，又重新回到了聚光灯下。这两年的 reasoning model（OpenAI 的 o 系列、[DeepSeek](https://en.wikipedia.org/wiki/DeepSeek) 的 R 系列）更是把 RL 推到了 LLM 训练流水线的中心位置。

### ML Theory

ML Theory 研究的是 ML 的数学性质：为什么深度网络能泛化、optimization landscape 长什么样、为什么过参数化的模型不会过拟合等等。这个方向和前面 theory 那部分其实有挺深的交集，需要很强的数学功底。

### AI for Science

AI for Science 是这几年才崛起的一个交叉方向，主要把 ML 用在具体的科学问题上。最有名的例子是 DeepMind 的 [AlphaFold](https://en.wikipedia.org/wiki/AlphaFold)，它基本解决了 [protein structure prediction](https://en.wikipedia.org/wiki/Protein_structure_prediction) 这个生物学界悬而未决五十年的问题，并因此拿到了 2024 年的诺贝尔化学奖。除此之外 AI for math、AI for materials science 这些也都是越来越受关注的方向。顺带提一句，如何使用 AI 做前面在理论方向中提到的 formal verification 从而降低其成本其实就是现在 AI for math 这个领域内最重要的研究问题之一。

说实话我觉得 AI 这个方向更像是 theory 和 systems 融合的产物，跨度非常之广。这个领域的研究既可以非常偏向理论又可以非常偏向系统。所以这也就对人的要求特别高。最顶尖的 AI researcher 往往都是数学和工程两手都过硬的 full-stack researcher，既能推 scaling law 这些理论分析，又能在几千张 GPU 上把一整套训练流程稳定跑起来。这种 profile 在任何其他 CS 子领域里都不算多见，但在 AI 领域几乎已经成了顶级 lab 的标配。

此外，从个人发展的角度来说，AI 大概是目前 CS 里钱最多、就业最好的方向之一，但与此同时也极度内卷、迭代极快，一篇 paper 挂到 arxiv 上，三个月之后可能就过时了。所以在这个方向待下去需要一种特别的心态：既要跟得上社区的节奏，又要在各种 hype 里保持判断力，不被裹挟。

## Interdisciplinary：CS 和其他学科的交叉

最后一个 cluster 是 interdisciplinary，也就是 CS 和别的学科之间的交叉地带。这部分的子方向大多是把 CS 的方法和工具用到某个具体领域的问题上，所以做这条线一般需要双重背景。下面挑几个有代表性的方向简单展开。

### Computational Biology / Bioinformatics

Computational Biology / Bioinformatics 是把 CS 用在生物学问题上的方向。具体的任务包括基因测序、蛋白质结构预测、药物发现、单细胞分析这些，前面提到的 AlphaFold 也算这个领域的标志性成果。这条线因为生物学本身的数据规模和复杂度都在飞速增长，加上 ML 工具又越来越强，未来很长一段时间大概率都会是一个增长方向。

### Computer Graphics

Computer Graphics 研究的是怎么用计算机生成、表示、操作视觉内容，像电影特效、游戏渲染、3D 建模、物理仿真都属于这个范畴。近些年随着 VR/AR 的发展和 generative model 的进步，这个领域也变得越来越活跃，比如 [NeRF](https://en.wikipedia.org/wiki/Neural_radiance_field)、[Gaussian Splatting](https://en.wikipedia.org/wiki/Gaussian_splatting) 这些技术就是把传统 graphics 和现代 ML 结合起来的成功案例。

### Human-Computer Interaction

Human-Computer Interaction 研究的是人和计算机之间的交互：UI/UX 怎么设计、accessibility 怎么处理、AR/VR 怎么做、新型输入设备怎么设计。HCI 是 CS 里最 user-facing 的方向之一，所以它的研究经常会涉及用户研究、心理学这些传统上不算 CS 的方法论。当然现在随着 GenAI 的爆发也有不少人开始研究 AI 和人的交互以及对社会的影响，这些也都属于 HCI 的范畴。

### Robotics

Robotics 研究的是怎么让物理 agent 在真实世界里感知、推理、行动。这个领域天然横跨 ML、控制理论、机械工程等好几个学科。最近随着 LLM 的进步，把 LLM 当作机器人的高层规划器也成了一个挺活跃的研究方向。

### Economics & Computation

Economics & Computation 是 CS 和经济学的交叉，某种程度上和 Operations Research 挺像的，研究的问题包括机制设计（比如一场拍卖怎么设计才能让大家诚实出价）、algorithmic game theory、市场设计这些。这条线和工业界的关系也挺紧密，Google、[Meta](https://en.wikipedia.org/wiki/Meta_Platforms) 这些公司的广告竞价系统背后就有大量这方面的研究在支撑。

### Visualization

Visualization 研究的是怎么把高维或者复杂的数据用人能看懂的方式展示出来。这个方向虽然小众，但在数据科学、科学计算这些场景里非常重要。

### CS Education

CS Education 研究的是 CS 应该怎么教。具体研究的问题包括语言设计（怎么设计一种对初学者友好的编程语言）、教学法（怎么教抽象、怎么教递归）以及 access equity（怎么让更多 underrepresented group 进入这个学科）等等。

Interdisciplinary 这个 cluster 整体的选择面非常广，适合那些除了 CS 还对某个具体领域有兴趣的人。它另外一个好处是：因为问题来源比较多样，funding 也比较分散，所以受单一领域 hype 周期的影响相对小一些。

回到文章开头的问题：上了大学以后会发现 CS 是一门什么样的学科？对我自己来说最大的体会就是：CS 比高中阶段接触的 coding 和算法竞赛要广得多。它既可以是一门极其数学的学科（比如 theory 的部分），也可以是一门极其工程的学科（比如 systems 的部分），还可以是一门和几乎任何其他学科交叉的学科（甚至包括法律、哲学等等）。每个人都能在里面找到一个适合自己背景和兴趣的方向，这也是我开头提到的 horizontal heterogeneity 的真正含义。

对于学弟学妹们来说这里还有一点值得注意：上面对每个方向的介绍只是想让大家对这个学科的 landscape 有一个基本的认识，并不是让大家现在就想好 commit 到哪一个领域。其实我见过很多人即使到本科快结束了都还没有一个特别 concrete 的想法，这完全没问题。大部分人最后的 commitment 也只是因为觉得某个方向有前途，或者恰好收到了某个特定方向的教授或者公司岗位的 offer，就这么定下来了。我介绍了这么多只是希望大家对 CS 这门学科多一些了解，看看里面有没有哪个小角落让自己 feel right，而不是要现在就给大家施加什么压力。

## CS 选校

在正式进入这章之前，我推荐读者先行阅读[《关于选校》]({{ '/guides/chinese/school-selection-CN/' | relative_url }})一篇，因为在这里会使用到不少那一篇里面已经介绍过的分析方法和结论。此外需要说明的一点是，这个 section 会延续之前 research 视角的领域分类方法，主要从做本科教学和学术研究的角度来分析各个学校。而就业导向的分析则会留到下一个 section。

首先是我个人觉得对于本科生而言不同学校的 CS program 大致可以放在一个 spectrum 上，一端是 math-heavy 的教学风格，另一端是 engineering-heavy 的教学风格。当然不同的教学风格其实某种程度上也反应了这个学校的 research 风格。

Math-heavy 的项目最典型的特征是 theory 类课程在本科必修里占比高、math prerequisite 厚。典型代表是 Princeton、Cornell、Caltech 等学校，必修课会要求学生有很强的读和写 proof 的能力。这一类学校比较适合想做 ML theory、cryptography、formal methods 这种 math-heavy 方向的人。

Engineering-heavy 项目的典型特征则是 systems 类课程在本科 curriculum 里占比高、必修课 project load 重、hands-on training 多。典型代表是 CMU、UIUC、Georgia Tech 等学校，毕业时学生一般会有大量系统编程的 hands-on 经验。此外很多 mid-tier R1 在 systems 方向做得非常深，比如 NC State 和 UTK 的 engineering 文化重，这两所学校在 HPC 方向都是顶尖的。这些学校比较适合想做 systems、industry-bound SWE、applied ML 的人。

中间地带是像 MIT、Stanford、UC Berkeley 等这种 math 和 engineering 双修的 culture，必修课同时包含 proof-heavy theory course 和 implementation-heavy systems course。但代价是必修 load 重，对于不少"普通优秀"的同学来说容易进退维谷。

对于大部分文理学院来说这个情况又会有所不同，他们的风格一般不会有这么大的差异。正如我在[《关于选校》]({{ '/guides/chinese/school-selection-CN/' | relative_url }})一文中所提到的，因为文理学院的 lab 资源有限，所以他们 default 重视理论；但 Harvey Mudd 是个例外，他们的整个 program 是出名的 engineering-heavy。

对于看完之后开始纠结的学弟学妹而言，这个 spectrum 里其实并没有一个永远正确的选项，我觉得它更像是一个 self-auditing tool：你需要诚实问自己 "我喜欢的是 proof 还是 implementation、是理论还是 applied science、是 mathematical clarity 还是 engineering elegance"，然后选 spectrum 上 fit 你的位置。当然对于比较好的 R1 CS program 而言，不论学校本身是 math-heavy 还是 engineering-heavy，在每个领域里都会有世界级的教授，所以即使现在 commit 了一个教学重心没那么契合的学校，也可以多上一点自己感兴趣的领域的选修课或者去找对应领域的专家一起做 research。这其实就是 faculty 数量多的一个非常大的好处。

在这里顺带说一下 CSRankings 的一个 known limitation——一个学校的排名很大程度上反映的是 institutional total output 而不是 per-faculty quality，所以 faculty 数量少但人均水平高的 department 在排名上会被显著 understate。这一点在之前介绍 CSRankings 时就 promise 过会在选校部分展开。Caltech 是这个 limitation 最典型的受害者：这个学校本身就非常小，一届大概就 200 多个本科生；CS department 也是很小的，faculty 数量很少，所以就导致了他们虽然有着不少很厉害的教授，但是在 CSRankings 上的排名却非常低。实际操作上，CSRankings 网站点开每个学校名字就会展开该校所有 faculty 的 count 列表，大家可以把每个学校头部 faculty 的水平和学校总体排名结合起来一起看而不只是看 institutional 总分。当然，faculty 少的学校开设课程的多样性必然就低，这也是一个需要重要考虑的 tradeoff。这一点在文理学院最为明显。前面提到 LAC default 重视理论一部分原因是 lab 资源有限，而另一部分原因正是 faculty 数量小限制了选修课的覆盖面。

接下来我想给对 research 感兴趣的同学大概介绍一下每个学校的强势领域。首先 Top 4 的 CMU、MIT、Stanford 和 UC Berkeley 就不用多说了，这四所学校在大部分主流方向都是最厉害的，基本不需要 audit specific subarea。对于除此之外的其他学校，AI 方向 University of Washington 是最好的，systems 方向最强的是 UIUC，而 theory 方向最好的则是 Princeton。但我们真的可以做这样的排序吗？这种 single-label 的描述当然是舒服的，因为它为读者用最少的 cognitive cost 建立起来了一个 mental model，但实际上这是一个很不负责任的简化。"在这个领域内某学校特别强"这句话的意思实际上更接近"这个学校在这个领域里的 visibility 特别高 / historically 出名"，但绝不是"这个学校只在这个领域内强"，也不是"这个领域只有这一所强校"，更不是"排名比较一般的学校就不存在最顶尖的教授"。所以假如各位读者有一个自己具体感兴趣的方向，建议直接上 CSRankings 选 specific subarea filter 来看看这个领域内的生态究竟是什么样的，而不是只凭这种粗略的 label。

当然 CSRankings 也不绝对，它反映的是一个学校历史上的 publication record，没法体现一个 program 当前的 trajectory。比如最近新招进来的 rising star 潜力无限但无法在数据里体现，而已经退休的 senior faculty 反而可能还在 count。所以一个比较 practical 的补充办法是去看一个 program 里的 faculty 这几年有没有持续拿到 [Sloan Research Fellowship](https://en.wikipedia.org/wiki/Sloan_Research_Fellowship)、[NSF CAREER Award](https://en.wikipedia.org/wiki/National_Science_Foundation_CAREER_Award) 这一类 early-career award；这些奖都是同行评审出来的，相对能反映出业内对这群人未来几年潜力的判断。具体操作上不需要自己一个一个去翻系里的网站，直接让 AI agent（比如 Claude 或 ChatGPT 的 deep research 模式）帮你列出来就行，这种查找类的任务 AI 往往比人快得多也准得多。

此外，对于想做 research 的同学来说，[《关于选校》]({{ '/guides/chinese/school-selection-CN/' | relative_url }})一文里的 ceiling × demand framework 在这里直接适用。比如 UIC 的数据挖掘、犹他大学的图形学这些 field-specific 顶尖的 mid-tier R1 就是 CS sweet spot 的典型样例。这样 sweet spot 的例子在 CS 里还有很多。好学校里 Sloan Research Fellowship 等颇有含金量的奖项的得主可能会多一些，但这并不意味着这些人在 mid-tier R1 就不存在。所以就像我在[《关于选校》]({{ '/guides/chinese/school-selection-CN/' | relative_url }})中提到的，只要去一个还不错的学校一样可以有很好的发展。

这里还有一个值得一提的 mechanism 是国家实验室带来的算力优势。[美国能源部](https://en.wikipedia.org/wiki/United_States_Department_of_Energy)旗下有多家国家实验室，头部的几家都 host 了顶级的 supercomputing facility，有着远超一般学术界的算力资源。地理上邻近这些实验室的学校自然就近水楼台先得月，通过 joint appointment、collaborative project 等 channel 在合作研究时有结构性的优势。这是一个和学校排名几乎正交的维度。具体来讲，[Lawrence Berkeley National Laboratory](https://en.wikipedia.org/wiki/Lawrence_Berkeley_National_Laboratory) 旗下的 [NERSC](https://en.wikipedia.org/wiki/National_Energy_Research_Scientific_Computing_Center) host 了 [Perlmutter](https://en.wikipedia.org/wiki/Perlmutter_(supercomputer)) 和即将 launch 的 Doudna 超算，UC Berkeley 就在山下；[Argonne National Laboratory](https://en.wikipedia.org/wiki/Argonne_National_Laboratory) host 了 [Aurora](https://en.wikipedia.org/wiki/Aurora_(supercomputer)) 这台全球排名第三的 supercomputer，附近有 UChicago，UIC 和 Northwestern 等；全球排名第二的 [Frontier](https://en.wikipedia.org/wiki/Frontier_(supercomputer)) 超算位于 [Oak Ridge National Laboratory](https://en.wikipedia.org/wiki/Oak_Ridge_National_Laboratory)，附近有 UTK 和南方各校；全球排名第一的 [El Capitan](https://en.wikipedia.org/wiki/El_Capitan_(supercomputer)) 超算则位于 [Lawrence Livermore National Laboratory](https://en.wikipedia.org/wiki/Lawrence_Livermore_National_Laboratory)，附近有 UC system 各校和其他加州学校。除此之外还有 [SLAC](https://en.wikipedia.org/wiki/SLAC_National_Accelerator_Laboratory)（附近的 Stanford）、[Brookhaven](https://en.wikipedia.org/wiki/Brookhaven_National_Laboratory)（附近 NYC 一带的 Stony Brook、Columbia、NYU 等）以及其他很多例子。这种 partnership 在做 systems（尤其是 HPC）、AI for science、大规模 ML 等方向的研究时往往是 complete game-changer。所以对应方向的同学选校时除了看前面介绍的那些指标，也建议看一看学校附近有没有这种 national lab。一般来说地理位置上邻近的 R1 都会至少有几个和国家实验室有合作的 faculty，而 partnership 深厚的学校（比如 UC Berkeley、UTK 这种）合作 faculty 数量则会多得多。

## CS Career Path

最后我想再聊一聊对于本科毕业想直接就业的同学们来说，比较常见的 CS career path 有哪些。说实话我觉得对于本科生来说专业对口的基本上就是 SWE 和 quant 这两个。当然其他还有一些像是创业、product management 和 consulting 之类的，但我都没太了解过，而且这些也都不是 CS specific 的，所以在这里就不多做讨论了。

我一直觉得不少公司的 SWE 就是一个筐，什么都可以往里装。所以这个岗位实际上囊括的工作范围远比听上去要大。根据公司业务和技术栈的不同，SWE 内部的生态非常多元，下面挑几个比较有代表性的分支简单聊聊。

### Product Engineer

首先最常见的是 Product Engineer，根据具体业务还会进一步分成 App、Web 和 Backend 几类。他们工作的重心是实现 product manager 设计的业务逻辑，比如给某个 App 加一个新的 feature、把网页加载速度从 800ms 压到 400ms 以下，或者为高并发业务设计能撑住峰值千万级 QPS 的后端架构。这一线更强调对业务的理解、对分布式系统的熟练度，以及在大型 monorepo 里能高效迭代的工程能力。大厂里 product 这条线的 headcount 是最大的，对应届毕业生也最友好——Meta、Google、[Amazon](https://en.wikipedia.org/wiki/Amazon_(company)) 这些公司每年招的应届 SWE 绝大多数都会先加入到 product 团队里。除了这些 [FAANG](https://en.wikipedia.org/wiki/Big_Tech) 传统大厂之外，[Stripe](https://en.wikipedia.org/wiki/Stripe,_Inc.)、[Notion](https://en.wikipedia.org/wiki/Notion_(productivity_software))、[Figma](https://en.wikipedia.org/wiki/Figma)、[Cloudflare](https://en.wikipedia.org/wiki/Cloudflare) 这种正在高速扩张的大公司招的 SWE 主力也是 product engineer，这些公司体量比大厂小、单人能 own 的业务范围反而更大，对工程独立性的要求往往不低，近几年也成了不少应届生很倾向的选择。

### Systems/Infrastructure Engineer

然后偏向 systems 的是 Systems/Infrastructure Engineer。这一类 SWE 的工作更接近之前提到的 systems research 的范畴，但和 researcher 相比关心的问题不太一样：researcher 关心怎么把一个 idea 写成一篇 paper，而 infra engineer 关心怎么把这个论文里的 idea 真正落实到生产环境里稳定跑起来。具体工作包括自研数据库（比如 Google 的 Spanner、Meta 的 MyRocks）、分布式存储、CI/CD 流水线、自研编译器和工具链，甚至包括 kernel patch。这类岗位在 [Databricks](https://en.wikipedia.org/wiki/Databricks)、Snowflake、Stripe 这种以底层基础设施为核心业务的公司里 headcount 占比特别高，大厂里也都有专门的 infra org。但这条线对 systems 底层理解的要求很高，所以对大部分本科生没那么友好。

### Machine Learning Engineer

最后是偏向 AI 的 Machine Learning Engineer（MLE）。这个岗位和 systems engineer 一样，本质上还是工程师，他们的工作不是推导公式，而是怎么把 researcher 训练出的模型真正部署到生产当中。每天要做的事情包括处理海量训练数据、写训练 pipeline、把模型在手机端做低功耗运行、保证大规模推理的低延迟、做 model serving 的扩缩容等等。具体落地上，OpenAI、Anthropic、Google deepmind 这种 frontier lab 的 MLE 更多是和 researcher 一起把模型训练跑起来；而 Meta、Google 内部业务驱动的团队的 MLE 则主要是把 ranking model、recommendation system 这类东西做落地调优。这个岗位不仅需要对常用的 AI 模型有理论上的理解，更要能熟练使用 PyTorch、Triton、CUDA 这些技术栈。过去两三年随着 GenAI 的爆发，这条线也成了 SWE 里对本科生而言增长最快、薪水也最高的方向之一，但与此同时它对 candidate 的要求也很高。

### 传统行业 SWE

以上三类都是科技行业内部的 SWE 分支，但 SWE 这个岗位的 footprint 其实远不止科技公司。[S&P 500](https://en.wikipedia.org/wiki/S%26P_500) 里相当一部分公司虽然不是纯科技公司，但内部都有规模可观的 engineering 团队，而且前面提到的 product、infra、MLE 三条支线在这些公司里基本都齐全：比如 [Walmart](https://en.wikipedia.org/wiki/Walmart)、[Target](https://en.wikipedia.org/wiki/Target_Corporation) 内部的电商业务线主要对应 product engineering、[Visa](https://en.wikipedia.org/wiki/Visa_Inc.) 和 [Mastercard](https://en.wikipedia.org/wiki/Mastercard) 的支付系统是典型的大规模 infra 工程、而 [Disney](https://en.wikipedia.org/wiki/The_Walt_Disney_Company) 的流媒体推荐系统和 [UnitedHealth](https://en.wikipedia.org/wiki/UnitedHealth_Group) 的 risk modeling 都越来越依赖 MLE。这些"传统行业"里的 SWE 岗位的特点是 compensation 比 FAANG 低一档、工作节奏相对温和、business 也更稳定，对想要 work-life balance 或者积累特定行业 domain knowledge 的同学是一个很不错的选择。

传统行业里一条比较特殊的线是投行体系内的 SWE。[Goldman Sachs](https://en.wikipedia.org/wiki/Goldman_Sachs)、[Morgan Stanley](https://en.wikipedia.org/wiki/Morgan_Stanley)、[JP Morgan](https://en.wikipedia.org/wiki/JPMorgan_Chase) 等这些大投行内部都有数千甚至上万人规模的 engineering org，前面那三条支线在投行里同样一应俱全：面向客户的 trading platform 和内部 portal 属于 product engineering、自研的低延迟撮合引擎和 market data 系统是典型的 infra engineering，而 fraud detection、credit risk、algorithmic execution 这些越来越依赖 MLE。这一类 SWE 在投行内部一般被叫做 strats 或者 tech，compensation 通常介于大厂和传统 S&P 500 之间。

### Quant

其实投行里一部分 SWE 岗位的工作内容其实已经很接近 quant 了，但对 candidate 的要求一般来说比 quant 要低一些。所以 quant 究竟是干什么的呢？在回答这个问题之前我觉得先要把 quant 分为两类：一类是高频做市商，另一类则是对冲基金。

做市商就是一个在市场里提供流动性的角色，简单理解的话就是"二道贩子"，负责在市场上同时报一个买价（bid）和一个卖价（ask），从中赚取这个差价（bid-ask spread）。当然现在股票已经全面进行电子交易了，所以做市商都会在线上进行高频做市。这条线上最有名的几家公司包括 [Jane Street](https://en.wikipedia.org/wiki/Jane_Street_Capital)、[Citadel Securities](https://en.wikipedia.org/wiki/Citadel_Securities)、[Hudson River Trading](https://en.wikipedia.org/wiki/Hudson_River_Trading)、[Jump Trading](https://en.wikipedia.org/wiki/Jump_Trading)、[Optiver](https://en.wikipedia.org/wiki/Optiver) 等等。做市商策略的核心 challenge 是低延迟——很多策略的盈亏就取决于微秒甚至纳秒级别的延迟差距，所以这类公司内部对 systems 工程能力的要求其实极高，相当一部分 quant developer 干的事情和顶级 infra engineer 没什么本质区别，只是 stack 是为了 ultra-low-latency 专门定制的（比如 kernel bypass、FPGA 加速、热路径上手写汇编等等）。一般来说这类公司里的岗位可以分成三类：quant trader 负责实时决策和策略调参，quant researcher 负责设计新策略和挖新的 signal，quant developer 则负责搭建和优化整个 trading infra。三类岗位的 compensation 都非常高，最顶尖几家公司的应届生 base salary 通常能有 $300k。

不同于做市商那样用自有资金做"二道贩子"，对冲基金这条线的业务逻辑主要是帮客户理财。从资金来源角度看这其实跟银行理财差不多，只不过客户群体更窄。他们的交易频率相比做市商会慢很多，但策略空间也更大。最有名的几家包括 [Citadel](https://en.wikipedia.org/wiki/Citadel_LLC)、[Two Sigma](https://en.wikipedia.org/wiki/Two_Sigma)、[D.E. Shaw](https://en.wikipedia.org/wiki/D._E._Shaw_%26_Co.)、[Renaissance Technologies](https://en.wikipedia.org/wiki/Renaissance_Technologies)、[Millennium](https://en.wikipedia.org/wiki/Millennium_Management,_LLC)、[Point72](https://en.wikipedia.org/wiki/Point72_Asset_Management) 等等，每家公司内部又会进一步分出不同的业务线，每个业务线都对应不同的策略思路和投资哲学。整体上他们的策略持仓周期可以从几分钟到几个月不等，所以低延迟不像做市商那么 critical，但对 statistical modeling、time-series analysis、machine learning 这些数学建模工具的要求会更高。

对 CS 本科生来说，对冲基金这条线上能触及到的岗位会比做市商少一些。一方面，绝大部分基金采用主观交易而不是 systematic trading，CS 专业对于前者基本没有明显优势；另一方面，systematic fund 内部最 heavy 的岗位是 quant researcher，而这种岗位他们倾向于直接 hire 数学、统计、物理 PhD，应届本科生想直接进去比较困难。但顶级 systematic fund 里依然会有相当一部分面向 CS 本科生的 quantitative developer 岗位，最有代表性的是 Citadel 旗下的 GQS（Global Quantitative Strategies）。GQS 的 quantitative developer 主要负责给 quant researcher 搭建研究与回测平台、维护 production 上的 trading infra、以及做策略落地时所需要的各种工具链开发，本质上和顶级做市商里的 quant developer 干的事情非常接近，但区别主要在于 stack 服务的策略不同：对冲基金主要是中低频交易，而做市商主要是高频做市。Two Sigma 和 D.E. Shaw 有不少策略也都是 systematic 的，所以内部也都有类似定位的 quantitative developer pipeline。这类岗位在顶级 fund 里的 compensation 基本和顶级做市商的 quant developer 持平。

近几年另一个值得一提的趋势是，无论是做市商还是对冲基金，对 ML 的依赖都在明显加深——做市商主要用 ML 挖 short-horizon signal 和优化 execution，对冲基金则直接把 ML 当成系统化策略的核心引擎。从工程视角看，这其实和前面提到的大厂 MLE 在做的事情非常类似，只不过落地场景换成了 trading。

整体来说，无论是做市商还是对冲基金，进 quant 这条线的门槛都是 CS career path 里最高的之一，基本和 frontier lab 持平。做市商的 trading 岗位更看重数理直觉和反应速度，所以非常偏爱有数学、物理或者算法竞赛背景的本科生；对冲基金的大部分岗位都是 research，所以更看重独立做研究的能力，本科直接拿 offer 难度更大。值得一提的是，这两条线对应届 CS 本科生最 accessible 的入口其实都是 quant developer，因为对纯 trading 或 research 能力的要求相对低一些，但对工程能力的要求和大厂 infra engineer 持平甚至更高，所以对 systems 方向很 hands-on 的同学反而是个不错的目标。

## CS 产业分布

刚刚聊完了几条主流 career path，最后我想再换个视角，从地理上简单看一下美国 CS 产业的 hub 分布。这一点经常容易被忽略，但实际上对实习机会和毕业 placement 都有不少影响。

### 大厂

FAANG 大厂的核心 hub 是**旧金山湾区**（**Bay Area**，包括 **SF** 市区以及 **Mountain View** / **Palo Alto** / **Cupertino** 一带的 **South Bay**），Meta、Google、[Apple](https://en.wikipedia.org/wiki/Apple_Inc.)、Nvidia 的总部都在这里；**Seattle** 是第二大 hub，[Microsoft](https://en.wikipedia.org/wiki/Microsoft) 和 Amazon 的总部都在这里；**NYC** 也有不少大厂的办公室，主要做 fintech、广告、媒体相关的 product。近几年 **Austin** 也逐渐变成了一个新兴的大厂集群——Apple 在那里有 **Cupertino** 之外最大的园区，[Tesla](https://en.wikipedia.org/wiki/Tesla,_Inc.) 也因为税收和政策原因把总部搬到了 **Austin**（[Oracle](https://en.wikipedia.org/wiki/Oracle_Corporation) 2020 年也曾把总部从 **Bay Area** 搬到 **Austin**，但 2024 年又把全球总部移到了 **Nashville**），Meta、Google 等也都在 **Austin** 开了规模可观的 satellite office。

### 其他科技公司与 AI lab

除了大厂之外剩下的 tech firm 大概还分为两类：一类是已经上市的成熟中型科技公司，比如 Snowflake、Cloudflare、[Datadog](https://en.wikipedia.org/wiki/Datadog)、[MongoDB](https://en.wikipedia.org/wiki/MongoDB_Inc.)、[Twilio](https://en.wikipedia.org/wiki/Twilio)、Figma 等，这一档公司在 **SF** 之外的分布要比 FAANG 均匀得多——**NYC**（Datadog、MongoDB 等）、**Boston**（[HubSpot](https://en.wikipedia.org/wiki/HubSpot) 等）、**Austin**、**Chicago**（一些 enterprise SaaS）都有不小的 footprint。另一类则是高速增长但还没上市的 private firm，尤其是这两年起来的 AI lab 和 AI infra 公司：OpenAI、Anthropic、Databricks、Stripe、Notion、[Vercel](https://en.wikipedia.org/wiki/Vercel) 等等，他们的总部几乎清一色集中在 **SF** 市区。

### 传统行业

S&P 500 里的传统行业公司分布最广，SWE 团队基本跟着公司总部走，所以 hub 跨越了几乎整个**美国**。Retail 行业里的 Walmart 在 **Arkansas Bentonville**、Target 在 **Minneapolis**、[Home Depot](https://en.wikipedia.org/wiki/The_Home_Depot) 在 **Atlanta**、[Costco](https://en.wikipedia.org/wiki/Costco) 在 **Seattle** 东边的 **Issaquah**；healthcare 和 pharma 方面 UnitedHealth 在 **Minneapolis**、[CVS Health](https://en.wikipedia.org/wiki/CVS_Health) 在 **Rhode Island**、[Aetna](https://en.wikipedia.org/wiki/Aetna)（已被 CVS 收购）在 **Hartford**、[Pfizer](https://en.wikipedia.org/wiki/Pfizer) 在 **NYC**、[Merck](https://en.wikipedia.org/wiki/Merck_%26_Co.) 和 [J&J](https://en.wikipedia.org/wiki/Johnson_%26_Johnson) 在 **New Jersey**；投行方面 Goldman Sachs、Morgan Stanley、JP Morgan、[Citi](https://en.wikipedia.org/wiki/Citigroup) 这几家大行几乎清一色在 **NYC 曼哈顿**（也就是**华尔街**所在地）；非投行类的金融服务公司分布更广，Visa 在 **Peninsula** 的 **Foster City**、Mastercard 在 **NYC** 北郊的 **Purchase**、[Bank of America](https://en.wikipedia.org/wiki/Bank_of_America) 在 **Charlotte**、[Capital One](https://en.wikipedia.org/wiki/Capital_One) 在 **DC** 郊外的 **McLean**、[American Express](https://en.wikipedia.org/wiki/American_Express) 在 **NYC**；汽车方面 [Ford](https://en.wikipedia.org/wiki/Ford_Motor_Company) 和 [GM](https://en.wikipedia.org/wiki/General_Motors) 都在 **Detroit** 周边；aerospace / defense 方面 [Boeing](https://en.wikipedia.org/wiki/Boeing) 把总部从 **Chicago** 搬到了 **Arlington** 但 Commercial Airplanes 主力依然在 **Seattle** 一带，[Lockheed Martin](https://en.wikipedia.org/wiki/Lockheed_Martin) 在 **Bethesda**、[Northrop Grumman](https://en.wikipedia.org/wiki/Northrop_Grumman) 在 **Falls Church**；媒体方面 Disney 在**洛杉矶 Burbank**、[Comcast](https://en.wikipedia.org/wiki/Comcast) 在 **Philadelphia**。这一档岗位最大的特点就是分布广——如果毕业后不想留在 **Bay Area** / **Seattle** / **NYC** 这几个核心 tech hub 而希望去**美国**其他城市发展，S&P 500 传统行业基本是覆盖面最广、最容易找到 SWE 岗位的方向。另外值得一提的是这些公司近年也都在大力升级自己的 engineering org，像是 Walmart Global Tech、Capital One Tech 这种 sub-org 在内部基本已经按现代科技公司的标准来运营，对求职者来说体验和大厂 SWE 不会差太多。

### Quant

Quant 这条线上的两类公司分布略有差异。做市商方面，**Chicago** 是衍生品做市商的传统重镇，Jump Trading、[DRW](https://en.wikipedia.org/wiki/DRW_Trading_Group) 等的总部都在这里；**NYC** 则是 Jane Street、Hudson River Trading、[Virtu](https://en.wikipedia.org/wiki/Virtu_Financial) 这些 ETF / 期权 / 股票做市商的所在地；**Houston** 是 commodity 和能源交易的中心，Citadel、DRW 等大型 trading firm 都在那里设有规模可观的 commodity / 能源 desk，纯能源 trading 公司比如 [Vitol](https://en.wikipedia.org/wiki/Vitol)、[Mercuria](https://en.wikipedia.org/wiki/Mercuria_Energy_Group)、[Trafigura](https://en.wikipedia.org/wiki/Trafigura) 也都把 **US** 主力 office 设在 **Houston**；**Miami** 则是近几年新兴的 quant 聚集地，Citadel Securities 在 2022 年把总部从 **Chicago** 搬到了这里（**芝加哥**那边依旧保留有规模可观的 office）。对冲基金主要集中在 **NYC** 和隔壁**康州**，Two Sigma、D.E. Shaw、Millennium、Point72 总部都在这里，虽然他们中的一些公司在**芝加哥**也会有团队；近几年 Citadel 旗下的对冲基金主体把总部搬到了 **Miami**，Millennium、Point72、[Schonfeld](https://en.wikipedia.org/wiki/Schonfeld_Strategic_Advisors)、[Balyasny](https://en.wikipedia.org/wiki/Balyasny_Asset_Management)、[ExodusPoint](https://en.wikipedia.org/wiki/ExodusPoint_Capital_Management)、[D1 Capital](https://en.wikipedia.org/wiki/D1_Capital_Partners) 等也都陆续在 **Miami** 或附近的 **West Palm Beach** 开了规模可观的 office，加上 **Florida** 没有州个人所得税，这一带的 quant footprint 还在持续扩张。

上面梳理的这些产业集群其实和本科选校之间有一层非常直接的关系——CS 的产业分布是高度地理化的，学校所在地的产业集群往往会对找工作有特别大的帮助。**加州**的学校和**硅谷**的关系最紧密，FAANG、中厂、**SF** 的 unicorn 对这些学校的招聘都非常 aggressive；UW 凭借自身过硬的 CS program 以及和 Microsoft、Amazon 同处 **Seattle** 的地理优势，在 **PNW** 一带有几乎垄断地位的招聘 pipeline；UIUC 离 **Chicago** 比较近，本身又是 systems 重镇，所以是 **Chicago** trading firm 最大的 feeder 之一；UChicago 因为本身就在 **Chicago** 而且有很强的数学系，所以也特别受 **Chicago** trading firm 的青睐；UT Austin 本身就在 **Austin**，加上 CS program 也很强，所以是 **Austin** 大厂集群（Apple、Tesla、Oracle、Meta、Google 等）最直接的本科 pipeline；Georgia Tech 在 **Atlanta**，CS program 本身就是 top tier，对 **Atlanta** 几家 S&P 500 巨头（Home Depot、[Delta](https://en.wikipedia.org/wiki/Delta_Air_Lines)、[Coca-Cola](https://en.wikipedia.org/wiki/The_Coca-Cola_Company)、[UPS](https://en.wikipedia.org/wiki/United_Parcel_Service) 等）以及 FAANG 都有很强的 pipeline；Rice 因为本身就在 **Houston**，是前面提到的 **Houston** 能源 trading 圈最自然的本科 feeder；**NYC** 区域内的 Columbia、NYU 和 Princeton 则天然贴近**华尔街**，往 **NYC** trading firm 和对冲基金的 pipeline 就更不用说了。除此之外还有一类比较容易被忽视的 alignment：很多 S&P 500 巨头在招聘员工（包括 SWE）时其实非常 favor 总部附近的州立大学，所以一些紧邻 S&P 500 巨头总部的州立学校往往就是这些公司最主要的本科 pipeline——比如 University of Arkansas 之于 Walmart、University of Minnesota 之于 Target / UnitedHealth / [3M](https://en.wikipedia.org/wiki/3M)、Michigan / Michigan State 之于 Ford / GM、NC State / UNC 之于 Bank of America、UMD / Virginia Tech / UVA 之于 **DC** 一带的 defense（Lockheed、Northrop）和 Capital One、Purdue 之于 **Indianapolis** 的 [Eli Lilly](https://en.wikipedia.org/wiki/Eli_Lilly_and_Company)、Arizona State 之于 [Intel](https://en.wikipedia.org/wiki/Intel) 在 **Chandler** 的园区、University of Utah 之于 [Adobe](https://en.wikipedia.org/wiki/Adobe_Inc.) 等等。所以对于想本科毕业直接工作的同学而言，如果不是 Top 4 的顶校，那么以就业为导向选校时真正值得关注的是上面这种学校所在地和产业 hub 的 alignment，而绝不是 US News 或 CSRankings 上前后差几个名次这种 superficial 的因素。
