import { LegalSupportContact } from "@/components/legal/legal-support-contact";

/** Chinese legal body for Terms when locale is `zh`. */
export function TermsZhBody() {
  return (
    <section className="mt-8 space-y-4 text-sm leading-relaxed text-slate-200">
      <p>使用 isendai 即表示您同意本条款。如不同意，请勿使用本服务。</p>

      <h2 className="text-base font-semibold text-white">服务</h2>
      <p>
        isendai 提供 AI 辅助的文本生成与改写工具。输出由系统自动生成，可能包含错误。您在使用或发送任何结果前，有责任自行审阅并核实。
      </p>

      <h2 className="text-base font-semibold text-white">用户内容与隐私</h2>
      <p>
        您保留对所提交文本的权利。我们处理您的文本以生成结果，并可能存储您的输入与输出，以便您在不同设备上访问历史记录与版本。除非必要，请勿提交敏感个人数据。
      </p>

      <h2 className="text-base font-semibold text-white">付款</h2>
      <p>
        本服务可能通过一次性积分包和订阅提供。付款由 Lemon Squeezy（官方商户）处理。我们不存储您的完整银行卡信息。除法律要求外，费用可能不予退款。
      </p>

      <h2 className="text-base font-semibold text-white">可接受使用</h2>
      <p>
        您不得利用本服务生成违法内容、骚扰或诽谤他人，或违反适用法律。若我们有合理理由认为服务被滥用，可限制访问。
      </p>

      <h2 className="text-base font-semibold text-white">免责声明</h2>
      <p>
        本服务按「现状」提供，不作任何明示或默示保证。我们不保证输出准确、完整或适用于任何特定目的。
      </p>

      <h2 className="text-base font-semibold text-white">责任限制</h2>
      <p>
        在法律允许的最大范围内，isendai 不对因使用本服务而产生的间接、附带、特殊、后果性或惩罚性损害，或任何利润或收入损失承担责任。
      </p>

      <h2 className="text-base font-semibold text-white">联系</h2>
      <p>有关本条款的问题，请通过网站运营方或您购买收据上列明的支持渠道与我们联系。</p>
    </section>
  );
}
